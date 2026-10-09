// Gerador de áudio sintético profissional usando Web Audio API
// Funciona 100% no navegador sem depender de arquivos de áudio externos

class SoundManager {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // 1. Som de Sino de Visitante (estilo Wix chime/ding suave e luxuoso)
  playVisitorDing() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Nota 1 (E6 - 1318.5 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318.5, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Nota 2 (B6 - 1975.5 Hz) - toca 0.15s depois formando o chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1975.5, now + 0.15);
      gain2.gain.setValueAtTime(0.22, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.9);
    } catch (e) {
      console.warn('Erro ao tocar som de visitante:', e);
    }
  }

  // 2. Som de Caixa Registradora / Cha-Ching de Compra (vitória e ouro)
  playCashRegister() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Trinado inicial metálico
      const notes = [987.77, 1318.51, 1567.98, 2093.0]; // B5, E6, G6, C7
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.2, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.35);
      });

      // Sino dourado final sustentado (C7 com harmônicos)
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(2637.0, now + 0.28);
      bellGain.gain.setValueAtTime(0.35, now + 0.28);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      bell.connect(bellGain);
      bellGain.connect(ctx.destination);
      bell.start(now + 0.28);
      bell.stop(now + 1.8);
    } catch (e) {
      console.warn('Erro ao tocar som de venda:', e);
    }
  }
}

export const soundManager = new SoundManager();

// Utilitários de Notificação do Navegador (HTML5 Notifications API)
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const res = await Notification.requestPermission();
    return res === 'granted';
  }
  return false;
}

export function sendBrowserNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/symbol-ana-fitness.png',
        badge: '/symbol-ana-fitness.png',
        ...options,
      });
    } catch (e) {
      console.warn('Falha ao disparar notificação do navegador:', e);
    }
  }
}
