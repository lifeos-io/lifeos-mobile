import type { Conversation, Message } from '../types';

/**
 * The mock Coach: one conversation holding the exchange of Figma frame 11, and canned answers. The real Coach
 * answers with OpenAI from the user's situation; these only show the flow.
 */

const CONVERSATION = '019a6b10-0000-7000-8000-000000000c01';

export const conversations: Conversation[] = [
  { id: CONVERSATION, title: 'Kule', createdAt: '2026-11-08T19:00:00Z', updatedAt: '2026-11-08T19:01:00Z' },
];

export const messages: (Message & { conversationId: string })[] = [
  {
    id: '019a6b10-0000-7000-8000-000000000c11',
    conversationId: CONVERSATION,
    role: 'USER',
    content: "Direktör AI'ın önemli olduğunu söyledi. Kubernetes'i bırakmalı mıyım?",
    createdAt: '2026-11-08T19:00:00Z',
  },
  {
    id: '019a6b10-0000-7000-8000-000000000c12',
    conversationId: CONVERSATION,
    role: 'ASSISTANT',
    content: [
      "Kısa cevap: Kubernetes'i bırakmana gerek yok — 8 Kasım'da zaten park ettin. Asıl soru AI'ı rotaya almak.",
      '',
      '**Önce tek şey: direktör bunu nasıl söyledi?** Ekip hedefi olarak mı, genel bir gözlem olarak mı?',
      '',
      '- Öneri: 2 saatlik keşif. Rota değişmez.',
      '- Tek soru: ekipte AI hangi problem için konuşuluyor?',
    ].join('\n'),
    createdAt: '2026-11-08T19:01:00Z',
  },
];

/** A canned answer for a message: a few topics the scenario knows, otherwise a question back. */
export function cannedAnswer(content: string): string {
  const text = content.toLocaleLowerCase('tr-TR');
  if (text.includes('genel') || text.includes('gözlem')) {
    return [
      'O zaman bu bir sinyal, gereksinim değil. Rotaya almıyoruz.',
      '',
      '- Bu hafta 2 saat keşif: ekipte AI ile ilgili konuşulan **tek bir somut problemi** bul.',
      "- 22 Kasım yer kontrolünde AI Engineering'i yeniden puanla.",
    ].join('\n');
  }
  if (text.includes('ekip') || text.includes('hedef')) {
    return [
      'Ekip hedefiyse ağırlığı artar. Yine de önce sahibini ve problemi netleştir:',
      '',
      '- Salı 1:1’inde sor: **bu hedefin sahibi kim, başarı neye benziyor?**',
      '- Cevaba göre bir rota düzeltmesi önerebilirim; onaylamadan hiçbir şey değişmez.',
    ].join('\n');
  }
  if (text.includes('yorgun') || text.includes('enerji')) {
    return 'Bu hafta yakıtı düşürmek bir seçenek. Yer kontrolünde kapasiteyi 4 saatten 3 saate indirmeyi düşün; rota aynı kalır, tempo değişir.';
  }
  return 'Bunu karara bağlamak için bir şey eksik: bu, rotadaki hangi adımı ya da manevrayı etkiliyor? Biraz daha anlatır mısın?';
}
