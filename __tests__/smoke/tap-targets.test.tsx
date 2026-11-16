import { render, screen } from '@testing-library/react-native';

import { Chip, CHIP_HEIGHT, CHIP_SLOP } from '@/components/Chip';
import { SEGMENT_HEIGHT, SEGMENT_SLOP, SegmentedControl } from '@/components/SegmentedControl';

/** Apple's guideline: every control can be tapped in an area of at least 44 by 44 points. */
const MIN_TAP = 44;

describe('tap areas', () => {
  test('chips: 36 points tall plus slop reaches 44', async () => {
    expect(CHIP_HEIGHT + 2 * CHIP_SLOP).toBeGreaterThanOrEqual(MIN_TAP);
    await render(<Chip label="Diesel" onPress={() => undefined} testID="chip" />);
    expect(screen.getByTestId('chip').props.hitSlop).toBe(CHIP_SLOP);
  });

  test('segmented control: 32 points tall plus slop reaches 44', async () => {
    expect(SEGMENT_HEIGHT + SEGMENT_SLOP.top + SEGMENT_SLOP.bottom).toBeGreaterThanOrEqual(MIN_TAP);
    await render(
      <SegmentedControl
        options={[
          { key: 'a', label: 'Cheapest' },
          { key: 'b', label: 'Closest' },
        ]}
        value="a"
        onChange={() => undefined}
        testID="sort"
      />,
    );
    expect(screen.getByTestId('sort-a').props.hitSlop).toEqual(SEGMENT_SLOP);
    expect(screen.getByTestId('sort-b').props.hitSlop).toEqual(SEGMENT_SLOP);
  });
});
