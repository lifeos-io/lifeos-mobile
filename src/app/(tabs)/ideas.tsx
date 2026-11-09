import { Link, router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { useDecisions, useEvidence, useIdeas, useMainGoal } from '@/api/hooks';
import type { Decision, Evidence, Idea } from '@/api/types';
import {
  Card,
  ChevronRightIcon,
  LoadError,
  Loading,
  Orbit,
  Pill,
  PlusIcon,
  Screen,
  ScreenHeader,
  Txt,
  type PillTone,
} from '@/components';
import { dayMonth, daysBetween, duration, today } from '@/lib/format';
import { ideaStance, ideasInOrbit, inOrbit } from '@/lib/strategy';
import { colors } from '@/theme';

/** Uydular — the idea box (Figma 05): ideas around the goal, a pattern Kule noticed, open maneuvers. */
export default function IdeasScreen() {
  const goal = useMainGoal();
  const ideas = useIdeas();
  const evidence = useEvidence(goal.data?.id);
  const decisions = useDecisions();

  const orbiting = inOrbit(ideas.data ?? []);
  const open = (decisions.data ?? []).filter((decision) => decision.status === 'OPEN');

  return (
    <Screen tab>
      <ScreenHeader
        overline={`Yörüngede ${orbiting.length} uydu`}
        title="Uydular"
        subtitle="Yeni fikirler rotanı değiştirmez. Yer kontrolünde karara bağlanır."
        titleAside={
          <Pressable
            onPress={() => router.push('/ideas/new')}
            accessibilityRole="button"
            accessibilityLabel="Yeni uydu"
            hitSlop={8}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.acid,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}>
            <PlusIcon size={22} color="acidInk" />
          </Pressable>
        }
      />

      {ideas.isError ? <LoadError onRetry={() => ideas.refetch()} /> : null}
      {ideas.isPending ? <Loading /> : null}

      {orbiting.length > 0 ? <Orbit satellites={ideasInOrbit(orbiting)} height={170} /> : null}

      <Pattern ideas={ideas.data ?? []} evidence={evidence.data ?? []} />

      <View style={{ gap: 10 }}>
        {orbiting.map((idea) => (
          <IdeaRow key={idea.id} idea={idea} />
        ))}
      </View>

      {open.length > 0 ? <OpenDecisions decisions={open} /> : null}
    </Screen>
  );
}

const RECENT_DAYS = 21;

/**
 * Kule's pattern note: several ideas launched in the last three weeks while the goal has no fresh telemetry.
 * Shown from three ideas up.
 */
function Pattern({ ideas, evidence }: { ideas: Idea[]; evidence: Evidence[] }) {
  const now = today();
  const recent = ideas.filter((idea) => daysBetween(idea.createdAt.slice(0, 10), now) <= RECENT_DAYS).length;
  if (recent < 3) return null;
  const freshTelemetry = evidence.some((e) => daysBetween(e.occurredOn, now) <= RECENT_DAYS);
  return (
    <Card border="signal" fill="signalInk" style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <Pill label="Örüntü" tone="signal" />
      <Txt variant="small" style={{ flex: 1 }}>
        Son 3 haftada {recent} uydu fırlattın
        {freshTelemetry ? '.' : '; aktif konuda henüz telemetri yok.'}
      </Txt>
    </Card>
  );
}

function ideaPill(idea: Idea): { label: string; tone: PillTone } {
  switch (ideaStance(idea)) {
    case 'aktif':
      return { label: 'Aktif', tone: 'acid' };
    case 'keşif':
      return { label: `Keşif · ${duration(idea.evaluations.at(-1)!.weeklyMinutes)}`, tone: 'nebula' };
    case 'park':
      return { label: 'Park', tone: 'muted' };
    default:
      return { label: 'Yer kontrolü', tone: 'ghost' };
  }
}

function IdeaRow({ idea }: { idea: Idea }) {
  const pill = ideaPill(idea);
  return (
    <Link href={{ pathname: '/ideas/[id]', params: { id: idea.id } }} asChild>
      <Pressable accessibilityRole="button">
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="cardTitle">{idea.title}</Txt>
            {idea.note ? (
              <Txt variant="small" color="moonMid" numberOfLines={2}>
                {idea.note}
              </Txt>
            ) : null}
          </View>
          <Pill label={pill.label} tone={pill.tone} />
        </Card>
      </Pressable>
    </Link>
  );
}

function OpenDecisions({ decisions }: { decisions: Decision[] }) {
  return (
    <View style={{ gap: 10 }}>
      <Txt variant="overline" color="moonMid">
        Açık manevralar
      </Txt>
      {decisions.map((decision) => (
        <Link key={decision.id} href={{ pathname: '/decisions/[id]', params: { id: decision.id } }} asChild>
          <Pressable accessibilityRole="button">
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="cardTitle">{decision.title}</Txt>
                {decision.reviewOn ? (
                  <Txt variant="small" color="moonMid">
                    Değerlendirme · {dayMonth(decision.reviewOn)}
                  </Txt>
                ) : null}
              </View>
              <ChevronRightIcon color="moonMid" />
            </Card>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}
