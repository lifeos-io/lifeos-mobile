import { Card } from './Card';
import { Txt } from './Txt';

/** Stands in for a screen's content until its piece is built. */
export function Placeholder({ figmaFrame }: { figmaFrame: string }) {
  return (
    <Card border="line" fill="space">
      <Txt variant="small" color="moonMid">
        Bu ekranın içeriği sıradaki parçalarda gelecek. Figma: {figmaFrame}
      </Txt>
    </Card>
  );
}
