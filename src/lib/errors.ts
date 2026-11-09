import { ApiError } from '@/api/types';

const messages: Record<string, string> = {
  STRATEGY_ACTIVE_IDEA_LIMIT: 'Aynı anda en fazla 2 aktif uydu olabilir. Önce birini park et.',
  STRATEGY_IDEA_NOT_PURSUED: 'Keşif ancak son değerlendirme "keşif" dediyse başlar.',
  STRATEGY_IDEA_STATUS: 'Bu uydu artık bu adımda değil; ekranı yenile.',
  STRATEGY_PLAN_STATUS: 'Bu hafta zaten kapanmış.',
  CONCURRENT_MODIFICATION: 'Başka bir yerde değişti; ekranı yenile.',
  NETWORK: 'Sunucuya ulaşılamadı. Bağlantını kontrol et.',
  UNAUTHENTICATED: 'Oturumun bitti; tekrar giriş yap.',
  COACH_MODEL_UNAVAILABLE: 'Kule şu an cevap veremedi. Biraz sonra tekrar dene.',
};

/** What to tell the user about a failed request. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return messages[error.code] ?? 'İşlem yapılamadı.';
  }
  return 'İşlem yapılamadı. Tekrar dene.';
}
