import { render, screen, fireEvent } from '@testing-library/react';
import { AccordionPanel } from '../AccordionPanel';

describe('AccordionPanel', () => {
  test('renders title and summary', () => {
    render(
      <AccordionPanel title="Film Stack" summary="8 layers" defaultOpen={false}>
        <div>content</div>
      </AccordionPanel>,
    );
    expect(screen.getByText('Film Stack')).toBeInTheDocument();
    expect(screen.getByText('8 layers')).toBeInTheDocument();
  });

  test('toggles content visibility on header click', () => {
    render(
      <AccordionPanel title="Film Stack" summary="8 layers" defaultOpen={false}>
        <div>inner content</div>
      </AccordionPanel>,
    );
    expect(screen.queryByText('inner content')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('inner content')).toBeInTheDocument();
  });

  test('renders content when defaultOpen is true', () => {
    render(
      <AccordionPanel title="Film Stack" summary="8 layers" defaultOpen={true}>
        <div>visible content</div>
      </AccordionPanel>,
    );
    expect(screen.getByText('visible content')).toBeInTheDocument();
  });
});
