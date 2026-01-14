import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalysisTriggerButton, { INVESTMENT_MASTERS } from '../../components/ui/AnalysisTriggerButton';

describe('INVESTMENT_MASTERS', () => {
  it('should have 4 investment masters', () => {
    expect(INVESTMENT_MASTERS).toHaveLength(4);
  });

  it('should have Kostolany as first master', () => {
    const kostolany = INVESTMENT_MASTERS[0];
    expect(kostolany.id).toBe('kostolany');
    expect(kostolany.name).toBe('Kostolany');
    expect(kostolany.fullName).toBe('André Kostolany');
    expect(kostolany.emoji).toBe('🥚');
  });

  it('should have Buffett as second master', () => {
    const buffett = INVESTMENT_MASTERS[1];
    expect(buffett.id).toBe('buffett');
    expect(buffett.name).toBe('Buffett');
    expect(buffett.fullName).toBe('Warren Buffett');
    expect(buffett.emoji).toBe('🏦');
  });

  it('should have Munger as third master', () => {
    const munger = INVESTMENT_MASTERS[2];
    expect(munger.id).toBe('munger');
    expect(munger.name).toBe('Munger');
    expect(munger.fullName).toBe('Charlie Munger');
    expect(munger.emoji).toBe('📚');
  });

  it('should have Dalio as fourth master', () => {
    const dalio = INVESTMENT_MASTERS[3];
    expect(dalio.id).toBe('dalio');
    expect(dalio.name).toBe('Dalio');
    expect(dalio.fullName).toBe('Ray Dalio');
    expect(dalio.emoji).toBe('⚙️');
  });

  it('should have required properties for each master', () => {
    INVESTMENT_MASTERS.forEach((master) => {
      expect(master).toHaveProperty('id');
      expect(master).toHaveProperty('name');
      expect(master).toHaveProperty('subtitle');
      expect(master).toHaveProperty('fullName');
      expect(master).toHaveProperty('emoji');
      expect(master).toHaveProperty('color');
      expect(master).toHaveProperty('borderColor');
      expect(master).toHaveProperty('bgColor');
      expect(master).toHaveProperty('focus');
      expect(master).toHaveProperty('philosophy');
    });
  });
});

describe('AnalysisTriggerButton', () => {
  const defaultProps = {
    onAnalyze: vi.fn(),
    isAnalyzing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render button with default text', () => {
    render(<AnalysisTriggerButton {...defaultProps} />);

    expect(screen.getByText('Summon the Board')).toBeInTheDocument();
    expect(screen.getByText('Get AI insights from investment masters')).toBeInTheDocument();
  });

  it('should render custom button text', () => {
    render(
      <AnalysisTriggerButton
        {...defaultProps}
        buttonText="Analyze Market"
        subText="Custom subtitle"
      />
    );

    expect(screen.getByText('Analyze Market')).toBeInTheDocument();
    expect(screen.getByText('Custom subtitle')).toBeInTheDocument();
  });

  it('should call onAnalyze when clicked', () => {
    const onAnalyze = vi.fn();
    render(<AnalysisTriggerButton {...defaultProps} onAnalyze={onAnalyze} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onAnalyze).toHaveBeenCalledTimes(1);
  });

  it('should not call onAnalyze when analyzing', () => {
    const onAnalyze = vi.fn();
    render(<AnalysisTriggerButton {...defaultProps} onAnalyze={onAnalyze} isAnalyzing={true} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it('should not call onAnalyze when disabled', () => {
    const onAnalyze = vi.fn();
    render(<AnalysisTriggerButton {...defaultProps} onAnalyze={onAnalyze} isDisabled={true} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(onAnalyze).not.toHaveBeenCalled();
  });

  it('should show loading text when analyzing', () => {
    render(<AnalysisTriggerButton {...defaultProps} isAnalyzing={true} />);

    expect(screen.getByText('The Board is analyzing...')).toBeInTheDocument();
    expect(screen.queryByText('Summon the Board')).not.toBeInTheDocument();
  });

  it('should show custom loading text', () => {
    render(
      <AnalysisTriggerButton
        {...defaultProps}
        isAnalyzing={true}
        loadingText="Processing..."
      />
    );

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should show disabled text when disabled', () => {
    render(
      <AnalysisTriggerButton
        {...defaultProps}
        isDisabled={true}
        disabledText="Please wait..."
      />
    );

    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('should disable button when analyzing', () => {
    render(<AnalysisTriggerButton {...defaultProps} isAnalyzing={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should disable button when isDisabled is true', () => {
    render(<AnalysisTriggerButton {...defaultProps} isDisabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should show spinner when analyzing', () => {
    const { container } = render(<AnalysisTriggerButton {...defaultProps} isAnalyzing={true} />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show target emoji when not analyzing', () => {
    render(<AnalysisTriggerButton {...defaultProps} />);

    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('should show investment master names on hover', async () => {
    render(<AnalysisTriggerButton {...defaultProps} />);

    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);

    INVESTMENT_MASTERS.forEach((master) => {
      expect(screen.getByText(master.name)).toBeInTheDocument();
    });
  });

  it('should show investment master emojis on hover', () => {
    render(<AnalysisTriggerButton {...defaultProps} />);

    const button = screen.getByRole('button');
    fireEvent.mouseEnter(button);

    INVESTMENT_MASTERS.forEach((master) => {
      expect(screen.getByText(master.emoji)).toBeInTheDocument();
    });
  });
});
