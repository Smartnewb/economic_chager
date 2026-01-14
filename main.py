#!/usr/bin/env python3
"""
Insight Flow - AI Board of Directors
CLI interface for running multi-agent macro-economic debates.
"""

import sys
from agents import run_board_meeting
from agents.board import format_board_output


# Default scenario for testing
DEFAULT_SCENARIO = """
## Current Market Situation: The Strong Dollar Dilemma (January 2026)

**Key Data Points:**
- USD/JPY at 158 (near 40-year highs)
- US 10Y Treasury yield at 4.8%
- S&P 500 at all-time highs (6,200)
- Bitcoin at $105,000 (post-ETF rally)
- Fed signaling "higher for longer" rates
- BOJ still maintaining ultra-low rates despite currency pressure

**The Question:**
Capital is flowing massively from Asia (especially Japan) into US assets. 
Is this a sustainable trend or a crowded trade about to reverse? 
What should an investor do with their portfolio right now?
"""


def main():
    print("\n🌐 INSIGHT FLOW - AI Board of Directors\n")
    print("This system analyzes macro-economic scenarios through the lens of")
    print("three distinct investment philosophies.\n")
    
    # Check for custom scenario or use default
    if len(sys.argv) > 1 and sys.argv[1] == "--custom":
        print("Enter your scenario (press Enter twice when done):\n")
        lines = []
        while True:
            line = input()
            if line == "":
                if lines and lines[-1] == "":
                    break
                lines.append(line)
            else:
                lines.append(line)
        scenario = "\n".join(lines[:-1])  # Remove trailing empty line
    else:
        print("Using default scenario: 'The Strong Dollar Dilemma'\n")
        print("-" * 50)
        print(DEFAULT_SCENARIO)
        print("-" * 50)
        scenario = DEFAULT_SCENARIO
    
    print("\n⏳ Convening the Board of Directors...\n")
    print("   🚀 The Innovator is analyzing...")
    
    try:
        result = run_board_meeting(scenario)
        
        print("   🏦 The Value Master is considering...")
        print("   ♟️  The Contrarian is questioning...")
        print("   📊 Synthesizing viewpoints...\n")
        
        # Display formatted output
        print(format_board_output(result))
        
    except Exception as e:
        print(f"\n❌ Error during board meeting: {e}")
        print("\nTroubleshooting:")
        print("  1. Check your OPENAI_API_KEY in .env")
        print("  2. Ensure you have API credits available")
        print("  3. Try a simpler scenario")
        sys.exit(1)


if __name__ == "__main__":
    main()
