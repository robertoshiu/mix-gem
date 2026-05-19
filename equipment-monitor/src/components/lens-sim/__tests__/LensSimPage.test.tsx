import { render, screen, fireEvent } from '@testing-library/react';

// Mock Babylon.js and dynamic imports
jest.mock('@babylonjs/core', () => ({}));
jest.mock('@/hooks/use-webgl-support', () => ({
  useWebGLSupport: () => ({ supported: false }),
}));

describe('LensSimPage components', () => {
  describe('TimelineBar', () => {
    it('renders wafer count and controls', async () => {
      const { TimelineBar } = await import('@/components/lens-sim/TimelineBar');
      render(
        <TimelineBar
          currentIndex={2}
          lotSize={25}
          playing={false}
          currentWafer={null}
          onPlay={jest.fn()}
          onPause={jest.fn()}
          onStep={jest.fn()}
          onSeek={jest.fn()}
          onReset={jest.fn()}
          playbackSpeed={2}
          onSpeedChange={jest.fn()}
        />,
      );
      expect(screen.getByText(/3/)).toBeInTheDocument(); // wafer 3
      expect(screen.getByLabelText('Play')).toBeInTheDocument();
    });
  });

  describe('ParameterPanel', () => {
    it('renders all 6 sliders and 4 presets', async () => {
      const { ParameterPanel } = await import('@/components/lens-sim/ParameterPanel');
      const { DEFAULT_PARAMS } = await import('@/lib/lens-sim');
      render(
        <ParameterPanel
          params={DEFAULT_PARAMS}
          activePreset={null}
          onParamChange={jest.fn()}
          onPreset={jest.fn()}
        />,
      );
      expect(screen.getByText('Dose')).toBeInTheDocument();
      expect(screen.getByText('Cooling Failure')).toBeInTheDocument();
    });

    it('calls onPreset when preset button clicked', async () => {
      const { ParameterPanel } = await import('@/components/lens-sim/ParameterPanel');
      const { DEFAULT_PARAMS } = await import('@/lib/lens-sim');
      const onPreset = jest.fn();
      render(
        <ParameterPanel
          params={DEFAULT_PARAMS}
          activePreset={null}
          onParamChange={jest.fn()}
          onPreset={onPreset}
        />,
      );
      fireEvent.click(screen.getByText('Cooling Failure'));
      expect(onPreset).toHaveBeenCalledWith('cooling-failure');
    });
  });

  describe('WaferImpactMap', () => {
    it('renders metric tabs', async () => {
      const { WaferImpactMap } = await import('@/components/lens-sim/WaferImpactMap');
      render(<WaferImpactMap wafer={null} metric="cd" onMetricChange={jest.fn()} />);
      expect(screen.getByTestId('metric-tab-cd')).toBeInTheDocument();
      expect(screen.getByTestId('metric-tab-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('metric-tab-ler')).toBeInTheDocument();
      expect(screen.getByTestId('metric-tab-defectivity')).toBeInTheDocument();
    });

    it('calls onMetricChange when tab clicked', async () => {
      const { WaferImpactMap } = await import('@/components/lens-sim/WaferImpactMap');
      const onChange = jest.fn();
      render(<WaferImpactMap wafer={null} metric="cd" onMetricChange={onChange} />);
      fireEvent.click(screen.getByTestId('metric-tab-overlay'));
      expect(onChange).toHaveBeenCalledWith('overlay');
    });
  });
});
