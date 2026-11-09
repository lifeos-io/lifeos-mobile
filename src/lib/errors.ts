import { ApiError } from '@/api/types';

const messages: Record<string, string> = {
  STRATEGY_ACTIVE_IDEA_LIMIT: 'Aynı anda en fazla 2 aktif uydu olabilir. Önce birini park et.',
  STRATEGY_IDEA_NOT_PURSUED: 'Keşif ancak son değerlendirme "keşif" dediyse başlar.',
  STRATEGY_IDEA_STATUS: 'Bu uydu artık bu adımda değil; ekranı yenile.',
  STRATEGY_PLAN_STATUS: 'Bu hafta bu adıma izin vermiyor; ekranı yenile.',
  STRATEGY_PLAN_EXISTS: 'Bu hafta için zaten bir plan var.',
  STRATEGY_PLAN_ALREADY_ACTIVE: 'Önceki hafta hâlâ açık. Önce yer kontrolünde onu kapat.',
  STRATEGY_CAPACITY_EXCEEDED: 'Yakıt yetmiyor: adımlar haftanın süresini aşıyor. Yakıtı artır ya da bir adımı çıkar.',
  STRATEGY_DECISION_STATUS: 'Bu manevra bu adımda değil; ekranı yenile.',
  STRATEGY_DECISION_ALREADY_REOPENED: 'Bu manevra zaten yeniden açıldı; yeni taslaktan devam et.',
  VALIDATION_FAILED: 'Bazı alanlar geçersiz; kontrol edip tekrar dene.',
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
