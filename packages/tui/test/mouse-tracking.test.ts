import { describe, expect, it } from "bun:test";
import { TUI } from "@oh-my-pi/pi-tui";
import type { Terminal, TerminalAppearance } from "@oh-my-pi/pi-tui/terminal";

class RecordingTerminal implements Terminal {
	writes: string[] = [];
	columns = 80;
	rows = 24;
	kittyProtocolActive = false;
	kittyEnableSequence = null;

	start(_onInput: (data: string) => void, _onResize: () => void): void {}
	stop(): void {}
	async drainInput(): Promise<void> {}
	write(data: string): void {
		this.writes.push(data);
	}
	moveBy(_lines: number): void {}
	hideCursor(): void {}
	showCursor(): void {}
	clearLine(): void {}
	clearFromCursor(): void {}
	clearScreen(): void {}
	setTitle(_title: string): void {}
	setProgress(_active: boolean): void {}
	onAppearanceChange(_callback: (appearance: TerminalAppearance) => void): void {}
	get appearance(): TerminalAppearance | undefined {
		return undefined;
	}
}

describe("TUI mouse tracking", () => {
	it("can enable and disable SGR mouse tracking for the main screen", () => {
		const terminal = new RecordingTerminal();
		const tui = new TUI(terminal);

		tui.setMouseTrackingEnabled(true);
		tui.setMouseTrackingEnabled(false);

		expect(terminal.writes).toEqual(["\x1b[?1000h\x1b[?1003h\x1b[?1006h", "\x1b[?1006l\x1b[?1003l\x1b[?1000l"]);
	});
});
