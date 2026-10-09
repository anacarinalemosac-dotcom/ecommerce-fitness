'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';
import { MessageSquare, Phone, MapPin, Mail, Clock, Send, CheckCircle2, ArrowRight, Instagram } from 'lucide-react';

export default function ContatoPage() {
  const { lang, t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Dúvida sobre Tamanho / Medidas',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: 'Dúvida sobre Tamanho / Medidas', message: '' });
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-16">
      {/* Header Institucional */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-[10px] font-black uppercase tracking-widest text-gold block">
          ANA FITNESS WEAR • CUSTOMER CARE
        </span>
        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-wider text-deep-black">
          {t('contact.title')}
        </h1>
        <p className="text-xs sm:text-sm uppercase tracking-wider text-deep-black/60 font-medium leading-relaxed">
          {t('contact.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Formulário de Atendimento */}
        <div className="lg:col-span-7 bg-white border-2 border-deep-black p-8 sm:p-10 space-y-6 shadow-luxury">
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-deep-black">
              {lang === 'pt' ? 'ENVIE UMA MENSAGEM' : 'SEND A MESSAGE'}
            </h2>
            <p className="text-xs uppercase tracking-wider text-deep-black/60">
              {lang === 'pt' ? 'Retorno garantido em até 2 horas úteis.' : 'Fast response within 2 business hours.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black/80">
                  {lang === 'pt' ? 'NOME COMPLETO:' : 'FULL NAME:'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="EX: ANA SILVA"
                  className="w-full px-4 py-3 text-xs uppercase tracking-wider border border-deep-black/20 bg-white focus:outline-none focus:border-deep-black"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-deep-black/80">
                  {lang === 'pt' ? 'TELEFONE / WHATSAPP:' : 'PHONE / WHATSAPP:'}
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (978) 000-0000"
                  className="w-full px-4 py-3 text-xs uppercase tracking-wider border border-deep-black/20 bg-white focus:outline-none focus:border-deep-black"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black/80">
                {lang === 'pt' ? 'E-MAIL:' : 'EMAIL ADDRESS:'}
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-4 py-3 text-xs uppercase tracking-wider border border-deep-black/20 bg-white focus:outline-none focus:border-deep-black"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black/80">
                {lang === 'pt' ? 'ASSUNTO:' : 'SUBJECT:'}
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 text-xs uppercase tracking-wider border border-deep-black/20 bg-white focus:outline-none focus:border-deep-black"
              >
                <option value="Dúvida sobre Tamanho / Medidas">
                  {lang === 'pt' ? 'DÚVIDA SOBRE TAMANHO / MEDIDAS' : 'SIZING & MEASUREMENTS INQUIRY'}
                </option>
                <option value="Status de Pedido / Pré-Venda">
                  {lang === 'pt' ? 'STATUS DE PEDIDO OU PRÉ-VENDA' : 'ORDER STATUS & PRE-ORDER'}
                </option>
                <option value="Troca ou Devolução (30 Dias)">
                  {lang === 'pt' ? 'SOLICITAÇÃO DE TROCA OU DEVOLUÇÃO (30 DIAS)' : 'RETURN & EXCHANGE REQUEST (30 DAYS)'}
                </option>
                <option value="Modelos com Bojo Removível">
                  {lang === 'pt' ? 'DÚVIDA SOBRE BOJO REMOVÍVEL' : 'REMOVABLE BRA CUPS QUESTIONS'}
                </option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-deep-black/80">
                {lang === 'pt' ? 'MENSAGEM:' : 'MESSAGE:'}
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder={lang === 'pt' ? 'Como podemos te ajudar hoje?' : 'How can our concierge assist you today?'}
                className="w-full px-4 py-3 text-xs uppercase tracking-wider border border-deep-black/20 bg-white focus:outline-none focus:border-deep-black"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-deep-black hover:bg-gold text-white hover:text-deep-black text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{lang === 'pt' ? 'ENVIAR MENSAGEM' : 'SUBMIT MESSAGE'}</span>
            </button>

            {submitted && (
              <div className="p-3 bg-deep-black text-gold text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-gold">
                <CheckCircle2 className="w-4 h-4 text-gold" />
                <span>
                  {lang === 'pt'
                    ? 'Mensagem enviada com sucesso! Nossa consultora responderá em breve.'
                    : 'Message sent successfully! Our concierge team will reply shortly.'}
                </span>
              </div>
            )}
          </form>
        </div>

        {/* WhatsApp Direto Oficial & Detalhes da Sede em Leominster, MA */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card WhatsApp Oficial */}
          <div className="bg-deep-black text-white border border-gold/40 p-8 space-y-4 shadow-luxury">
            <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 text-gold px-2.5 py-1 inline-block border border-gold/30">
              {lang === 'pt' ? 'CONCIERGE DIRETO' : 'DIRECT CONCIERGE'}
            </span>
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
              WHATSAPP & PHONE
            </h3>
            <p className="text-xs uppercase tracking-wider text-white/70 font-medium leading-relaxed">
              {lang === 'pt'
                ? 'Fale diretamente com nossa consultora para envio de medidas exatas, fotos dos tecidos no corpo e suporte ao pedido.'
                : 'Chat directly with our styling concierge for measurements, fabric close-ups, and order assistance.'}
            </p>
            <a
              href="https://wa.me/19783139452?text=Hello%2C%20I%20would%20like%20to%20get%20more%20information%20about%20ANA%20Fitness%20Wear."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gold text-deep-black hover:bg-white text-xs font-black uppercase tracking-widest transition shadow"
            >
              <Phone className="w-4 h-4 text-deep-black" />
              <span>{t('contact.chatWhatsApp')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Card da Sede Oficial */}
          <div className="bg-white border-2 border-deep-black p-8 space-y-4 shadow-sm">
            <h3 className="text-base font-black uppercase tracking-wider text-deep-black flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold" />
              HEADQUARTERS & SHOWROOM
            </h3>

            <div className="space-y-3 text-xs uppercase tracking-wider text-deep-black/80 font-medium">
              <p>
                <strong className="text-deep-black font-black">ANA FITNESS WEAR LLC</strong><br />
                Leominster, MA 01453<br />
                United States
              </p>

              <div className="flex items-center gap-2 pt-2 border-t border-deep-black/10 text-deep-black font-bold">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <span>+1 (978) 313-9452</span>
              </div>

              <div className="flex items-center gap-2 text-deep-black font-bold">
                <Instagram className="w-4 h-4 text-gold shrink-0" />
                <a
                  href="https://www.instagram.com/anafitnessweareua"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-gold transition"
                >
                  @anafitnessweareua
                </a>
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-deep-black/10 text-[11px]">
                <Clock className="w-4 h-4 text-deep-black/50 shrink-0 mt-0.5" />
                <span>
                  Monday - Friday: 09:00 AM - 07:00 PM (EST)<br />
                  Saturday: 10:00 AM - 04:00 PM (EST)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
