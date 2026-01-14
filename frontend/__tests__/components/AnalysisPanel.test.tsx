import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnalysisPanel, { AnalysisResult } from '../../components/ui/AnalysisPanel';

const mockLegacyResult: AnalysisResult = {
  topic: 'Bond Market Analysis',
  timestamp: '2024-01-15T10:00:00Z',
  kostolany_response: 'Kostolany analysis text',
  buffett_response: 'Buffett analysis text',
  munger_response: 'Munger analysis text',
  dalio_response: 'Dalio analysis text',
  synthesis: 'Board synthesis text',
};

const mockPerspectivesResult: AnalysisResult = {
  topic: 'Stock Market Analysis',
  timestamp: '2024-01-15T10:00:00Z',
  perspectives: [
    { persona: 'kostolany', analysis: 'Kostolany perspective' },
    { persona: 'buffett', analysis: 'Buffett perspective' },
    { persona: 'munger', analysis: 'Munger perspective' },
    { persona: 'dalio', analysis: 'Dalio perspective' },
  ],
  synthesis: 'Synthesis from perspectives',
};

describe('AnalysisPanel', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Visibility', () => {
    it('should not render when isOpen is false', () => {
      render(<AnalysisPanel {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Board Analysis')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<AnalysisPanel {...defaultProps} />);

      expect(screen.getByText('Board Analysis')).toBeInTheDocument();
    });

    it('should show custom title', () => {
      render(<AnalysisPanel {...defaultProps} title="Custom Analysis" />);

      expect(screen.getByText('Custom Analysis')).toBeInTheDocument();
    });

    it('should show topic as title if provided', () => {
      render(<AnalysisPanel {...defaultProps} topic="Market Overview" />);

      expect(screen.getByText('Market Overview')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state when isLoading is true', () => {
      render(<AnalysisPanel {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Gathering insights from the Board...')).toBeInTheDocument();
    });

    it('should show loading state when isAnalyzing is true', () => {
      render(<AnalysisPanel {...defaultProps} isAnalyzing={true} />);

      expect(screen.getByText('Gathering insights from the Board...')).toBeInTheDocument();
    });

    it('should show current agent name when provided', () => {
      render(<AnalysisPanel {...defaultProps} isLoading={true} currentAgent="buffett" />);

      expect(screen.getByText('Warren Buffett is thinking...')).toBeInTheDocument();
    });

    it('should show custom loading subtitle', () => {
      render(
        <AnalysisPanel
          {...defaultProps}
          isLoading={true}
          loadingSubtitle="Custom loading message"
        />
      );

      expect(screen.getByText('Custom loading message')).toBeInTheDocument();
    });

    it('should show skeleton loaders during loading', () => {
      const { container } = render(<AnalysisPanel {...defaultProps} isLoading={true} />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('should show error message when analysisError is provided', () => {
      render(<AnalysisPanel {...defaultProps} analysisError="Something went wrong" />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Results Display - Legacy Format', () => {
    it('should display legacy format results', () => {
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          enableTypewriter={false}
        />
      );

      expect(screen.getByText('Kostolany analysis text')).toBeInTheDocument();
      expect(screen.getByText('Buffett analysis text')).toBeInTheDocument();
      expect(screen.getByText('Munger analysis text')).toBeInTheDocument();
      expect(screen.getByText('Dalio analysis text')).toBeInTheDocument();
    });

    it('should display synthesis from legacy results', () => {
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          enableTypewriter={false}
        />
      );

      expect(screen.getByText('Board synthesis text')).toBeInTheDocument();
    });
  });

  describe('Results Display - Perspectives Format', () => {
    it('should display perspectives format results', () => {
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockPerspectivesResult}
          enableTypewriter={false}
        />
      );

      expect(screen.getByText('Kostolany perspective')).toBeInTheDocument();
      expect(screen.getByText('Buffett perspective')).toBeInTheDocument();
      expect(screen.getByText('Munger perspective')).toBeInTheDocument();
      expect(screen.getByText('Dalio perspective')).toBeInTheDocument();
    });
  });

  describe('Investment Masters Display', () => {
    it('should show investment master subtitles', () => {
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          enableTypewriter={false}
        />
      );

      expect(screen.getByText('The Speculator')).toBeInTheDocument();
      expect(screen.getByText('The Oracle')).toBeInTheDocument();
      expect(screen.getByText('The Rationalist')).toBeInTheDocument();
      expect(screen.getByText('The Mechanic')).toBeInTheDocument();
    });

    it('should show investment master full names', () => {
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          enableTypewriter={false}
        />
      );

      expect(screen.getByText('André Kostolany')).toBeInTheDocument();
      expect(screen.getByText('Warren Buffett')).toBeInTheDocument();
      expect(screen.getByText('Charlie Munger')).toBeInTheDocument();
      expect(screen.getByText('Ray Dalio')).toBeInTheDocument();
    });

    it('should show investment master emojis', () => {
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          enableTypewriter={false}
        />
      );

      expect(screen.getByText('🥚')).toBeInTheDocument();
      expect(screen.getByText('🏦')).toBeInTheDocument();
      expect(screen.getByText('📚')).toBeInTheDocument();
      expect(screen.getByText('⚙️')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<AnalysisPanel {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByText('Close Panel');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      const { container } = render(<AnalysisPanel {...defaultProps} onClose={onClose} />);

      const backdrop = container.querySelector('.bg-black\\/60');
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onClose when ESC key is pressed', () => {
      const onClose = vi.fn();
      render(<AnalysisPanel {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Feedback', () => {
    it('should show feedback buttons when result is displayed', () => {
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          enableTypewriter={false}
        />
      );

      expect(screen.getByText('Was this analysis helpful?')).toBeInTheDocument();
      // Use getAllByText since there are two buttons containing "Helpful"
      const helpfulButtons = screen.getAllByText(/Helpful/);
      expect(helpfulButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle helpful feedback', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          enableTypewriter={false}
        />
      );

      // Find button by role and more specific name
      const buttons = screen.getAllByRole('button');
      const helpfulButton = buttons.find(btn => btn.textContent?.includes('👍'));
      if (helpfulButton) {
        fireEvent.click(helpfulButton);
        expect(consoleSpy).toHaveBeenCalled();
      }
    });

    it('should handle not helpful feedback', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          enableTypewriter={false}
        />
      );

      const buttons = screen.getAllByRole('button');
      const notHelpfulButton = buttons.find(btn => btn.textContent?.includes('👎'));
      if (notHelpfulButton) {
        fireEvent.click(notHelpfulButton);
        expect(consoleSpy).toHaveBeenCalled();
      }
    });

    it('should show thanks message after feedback', () => {
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          enableTypewriter={false}
        />
      );

      const buttons = screen.getAllByRole('button');
      const helpfulButton = buttons.find(btn => btn.textContent?.includes('👍'));
      if (helpfulButton) {
        fireEvent.click(helpfulButton);
        expect(screen.getByText('Thanks for your feedback!')).toBeInTheDocument();
      }
    });
  });

  describe('Follow-up Questions', () => {
    it('should show follow-up button when onFollowUp is provided and result exists', () => {
      const onFollowUp = vi.fn();
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          onFollowUp={onFollowUp}
          enableTypewriter={false}
        />
      );

      expect(screen.getByText('Ask Follow-up Question')).toBeInTheDocument();
    });

    it('should not show follow-up button when loading', () => {
      const onFollowUp = vi.fn();
      render(
        <AnalysisPanel
          {...defaultProps}
          isLoading={true}
          onFollowUp={onFollowUp}
        />
      );

      expect(screen.queryByText('Ask Follow-up Question')).not.toBeInTheDocument();
    });

    it('should show input field when follow-up button is clicked', () => {
      const onFollowUp = vi.fn();
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          onFollowUp={onFollowUp}
          enableTypewriter={false}
        />
      );

      const followUpButton = screen.getByText('Ask Follow-up Question');
      fireEvent.click(followUpButton);

      expect(screen.getByPlaceholderText('Ask a follow-up question...')).toBeInTheDocument();
    });

    it('should call onFollowUp when question is submitted', () => {
      const onFollowUp = vi.fn();
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          onFollowUp={onFollowUp}
          enableTypewriter={false}
        />
      );

      const followUpButton = screen.getByText('Ask Follow-up Question');
      fireEvent.click(followUpButton);

      const input = screen.getByPlaceholderText('Ask a follow-up question...');
      fireEvent.change(input, { target: { value: 'What about inflation?' } });

      const askButton = screen.getByRole('button', { name: 'Ask' });
      fireEvent.click(askButton);

      expect(onFollowUp).toHaveBeenCalledWith('What about inflation?');
    });

    it('should call onFollowUp when Enter is pressed', () => {
      const onFollowUp = vi.fn();
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          onFollowUp={onFollowUp}
          enableTypewriter={false}
        />
      );

      const followUpButton = screen.getByText('Ask Follow-up Question');
      fireEvent.click(followUpButton);

      const input = screen.getByPlaceholderText('Ask a follow-up question...');
      fireEvent.change(input, { target: { value: 'What about rates?' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onFollowUp).toHaveBeenCalledWith('What about rates?');
    });
  });

  describe('Market Context', () => {
    it('should display market context when provided', () => {
      render(
        <AnalysisPanel
          {...defaultProps}
          result={mockLegacyResult}
          marketContext={<div>Custom Market Context</div>}
          enableTypewriter={false}
        />
      );

      expect(screen.getByText('Market Context')).toBeInTheDocument();
      expect(screen.getByText('Custom Market Context')).toBeInTheDocument();
    });
  });

  describe('Alternative Props', () => {
    it('should accept analysisResult instead of result', () => {
      render(
        <AnalysisPanel
          {...defaultProps}
          analysisResult={mockLegacyResult}
          enableTypewriter={false}
        />
      );

      expect(screen.getByText('Kostolany analysis text')).toBeInTheDocument();
    });
  });
});
