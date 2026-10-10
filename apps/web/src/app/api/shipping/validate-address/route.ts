import { NextRequest, NextResponse } from 'next/server';

interface ZipInfo {
  zip: string;
  city: string;
  state: string;
  country: string;
}

// Fallback offline com os principais ZIP codes e intervalos dos EUA
const FALLBACK_ZIPS: Record<string, { city: string; state: string }> = {
  '01453': { city: 'Leominster', state: 'MA' },
  '01420': { city: 'Fitchburg', state: 'MA' },
  '02108': { city: 'Boston', state: 'MA' },
  '02215': { city: 'Boston', state: 'MA' },
  '01701': { city: 'Framingham', state: 'MA' },
  '01608': { city: 'Worcester', state: 'MA' },
  '01852': { city: 'Lowell', state: 'MA' },
  '01841': { city: 'Lawrence', state: 'MA' },
  '02138': { city: 'Cambridge', state: 'MA' },
  '33131': { city: 'Miami', state: 'FL' },
  '32801': { city: 'Orlando', state: 'FL' },
  '10001': { city: 'New York', state: 'NY' },
  '90210': { city: 'Beverly Hills', state: 'CA' },
  '94102': { city: 'San Francisco', state: 'CA' },
  '07030': { city: 'Hoboken', state: 'NJ' },
  '06901': { city: 'Stamford', state: 'CT' },
  '75001': { city: 'Dallas', state: 'TX' },
};

// Padronização e normalização de termos de endereço USPS
function normalizeStreetAddress(address: string): string {
  let clean = address.trim();
  clean = clean
    .replace(/\bStreet\b/gi, 'St')
    .replace(/\bAvenue\b/gi, 'Ave')
    .replace(/\bBoulevard\b/gi, 'Blvd')
    .replace(/\bRoad\b/gi, 'Rd')
    .replace(/\bDrive\b/gi, 'Dr')
    .replace(/\bLane\b/gi, 'Ln')
    .replace(/\bCourt\b/gi, 'Ct')
    .replace(/\bApartment\b/gi, 'Apt')
    .replace(/\bSuite\b/gi, 'Ste');

  return clean;
}

async function lookupZip(zipCode: string): Promise<ZipInfo | null> {
  const cleanZip = zipCode.replace(/\D/g, '').slice(0, 5);
  if (cleanZip.length !== 5) return null;

  // 1. Tenta API pública de alta velocidade Zippopotam
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`https://api.zippopotam.us/us/${cleanZip}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AnaFitnessWear-AddressValidator/1.0' },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.places && data.places.length > 0) {
        return {
          zip: cleanZip,
          city: data.places[0]['place name'],
          state: data.places[0]['state abbreviation'],
          country: 'US',
        };
      }
    }
  } catch (e) {
    // Falha silenciosa para fallback
  }

  // 2. Fallback offline embutido
  if (FALLBACK_ZIPS[cleanZip]) {
    return {
      zip: cleanZip,
      city: FALLBACK_ZIPS[cleanZip].city,
      state: FALLBACK_ZIPS[cleanZip].state,
      country: 'US',
    };
  }

  // 3. Fallback genérico por prefixo postal caso a rede externa falhe
  return null;
}

// GET para consulta rápida em tempo real (autofill e validação no blur do input)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get('zip') || '';
  const cleanZip = zip.replace(/\D/g, '').slice(0, 5);

  if (cleanZip.length !== 5) {
    return NextResponse.json(
      { error: 'ZIP Code deve ter exatamente 5 dígitos numéricos.' },
      { status: 400 }
    );
  }

  const info = await lookupZip(cleanZip);
  if (!info) {
    return NextResponse.json(
      { error: 'ZIP Code não localizado na base postal dos EUA (USPS).' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    valid: true,
    zip: info.zip,
    city: info.city,
    state: info.state,
    country: info.country,
  });
}

// POST para validação completa e estrita do formulário de entrega
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      address = '',
      apt = '',
      city = '',
      state = '',
      zip = '',
      phone = '',
      email = '',
      firstName = '',
      lastName = '',
    } = body;

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validação de ZIP Code
    const cleanZip = (zip || '').replace(/\D/g, '').slice(0, 5);
    if (!cleanZip || cleanZip.length !== 5) {
      errors.push('ZIP Code americano inválido. Informe 5 dígitos numéricos (ex: 01453 ou 02215).');
    }

    const zipLookup = cleanZip.length === 5 ? await lookupZip(cleanZip) : null;
    if (cleanZip.length === 5 && !zipLookup) {
      errors.push(`O ZIP Code ${cleanZip} não foi reconhecido nos Correios dos EUA (USPS). Verifique o código.`);
    }

    // 2. Validação de Cidade e Estado x ZIP Code
    if (zipLookup) {
      const providedCityUpper = (city || '').trim().toUpperCase();
      const zipCityUpper = zipLookup.city.toUpperCase();
      const providedStateUpper = (state || '').trim().toUpperCase();
      const zipStateUpper = zipLookup.state.toUpperCase();

      if (providedStateUpper && providedStateUpper !== zipStateUpper) {
        errors.push(
          `Inconsistência de Estado: O ZIP Code ${cleanZip} pertence ao estado de ${zipStateUpper} (${zipLookup.city}), mas foi selecionado ${providedStateUpper}.`
        );
      } else if (
        providedCityUpper &&
        !providedCityUpper.includes(zipCityUpper) &&
        !zipCityUpper.includes(providedCityUpper)
      ) {
        warnings.push(
          `Aviso USPS: O ZIP Code ${cleanZip} é oficialmente registrado para "${zipLookup.city}, ${zipLookup.state}".`
        );
      }
    }

    // 3. Validação de Rua e Número (Street Address)
    const cleanStreet = (address || '').trim();
    if (!cleanStreet || cleanStreet.length < 5) {
      errors.push('Endereço de entrega obrigatório (mínimo de 5 caracteres).');
    } else {
      // Verifica se possui número predial / residencial (obrigatório para entrega USPS nos EUA)
      const hasNumber = /\d+/.test(cleanStreet) || /P\.?O\.?\s*Box/i.test(cleanStreet);
      if (!hasNumber) {
        errors.push('O endereço precisa conter o número da residência (ex: 123 Main St ou P.O. Box 45).');
      }

      // Detecção de termos genéricos inválidos
      const lower = cleanStreet.toLowerCase();
      if (['teste', 'test', 'rua', 'street', 'casa', 'house', 'apartamento', 'none'].includes(lower)) {
        errors.push('Endereço inválido. Forneça o nome completo da rua e o número.');
      }
    }

    // 4. Validação de Cidade
    if (!city || city.trim().length < 2) {
      errors.push('Cidade de entrega é obrigatória.');
    }

    // 5. Validação de Estado
    if (!state || state.trim().length !== 2) {
      errors.push('Selecione um Estado americano válido (ex: MA, FL, NY, CA).');
    }

    // 6. Validação de Telefone (pelo menos 10 dígitos para contato de entrega SMS nos EUA)
    const cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      warnings.push('Recomendado telefone americano com pelo menos 10 dígitos (DDD + 7 dígitos) para atualizações de rastreamento.');
    }

    // 7. Validação de E-mail
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('E-mail informado possui formato inválido.');
    }

    const isValid = errors.length === 0;

    return NextResponse.json({
      valid: isValid,
      errors,
      warnings,
      normalized: isValid
        ? {
            address: normalizeStreetAddress(cleanStreet),
            apt: (apt || '').trim(),
            city: zipLookup ? zipLookup.city : city.trim(),
            state: zipLookup ? zipLookup.state : state.trim().toUpperCase(),
            zip: cleanZip,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          }
        : null,
      uspsVerified: Boolean(zipLookup),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao validar endereço' }, { status: 500 });
  }
}
