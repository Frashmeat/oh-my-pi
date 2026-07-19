import type { Component, NativeScrollbackLiveRegion } from "@oh-my-pi/pi-tui";
import type { TranscriptContainer } from "./transcript-container";

type TerminalRowsProvider = () => number | undefined;

/**
 * Root layout for interactive mode: transcript scrolls inside its own viewport,
 * while the composer/status area is always rendered at the terminal bottom.
 */
export class FixedTranscriptLayout implements Component, NativeScrollbackLiveRegion {
	readonly children: Component[];
	#lastTranscriptRows = 1;
	#activeTranscriptRows = 1;

	constructor(
		readonly transcript: TranscriptContainer,
		readonly bottomComponents: readonly Component[],
		readonly terminalRowsProvider: TerminalRowsProvider,
	) {
		this.children = [transcript, ...bottomComponents];
		transcript.setViewportRowsProvider(() => this.#activeTranscriptRows);
	}

	getTranscriptRows(): number {
		return this.#lastTranscriptRows;
	}

	getNativeScrollbackLiveRegionStart(): number {
		return 0;
	}

	isNativeScrollbackLiveRegionPinned(): boolean {
		return true;
	}

	invalidate(): void {
		this.transcript.invalidate();
		for (const component of this.bottomComponents) component.invalidate?.();
	}

	dispose(): void {
		this.transcript.dispose();
		for (const component of this.bottomComponents) component.dispose?.();
	}

	render(width: number): readonly string[] {
		width = Math.max(1, width);
		const height = this.#terminalRows();
		const bottomLines = this.#renderBottom(width);
		const visibleBottomLines =
			bottomLines.length > height ? bottomLines.slice(bottomLines.length - height) : bottomLines;
		const transcriptRows = Math.max(0, height - visibleBottomLines.length);

		this.#activeTranscriptRows = Math.max(1, transcriptRows);
		this.#lastTranscriptRows = this.#activeTranscriptRows;

		const transcriptLines = transcriptRows > 0 ? this.transcript.render(width).slice(0, transcriptRows) : [];
		const fillerRows = Math.max(0, height - transcriptLines.length - visibleBottomLines.length);
		const lines: string[] = [];
		for (const line of transcriptLines) lines.push(line);
		for (let i = 0; i < fillerRows; i++) lines.push("");
		for (const line of visibleBottomLines) lines.push(line);
		return lines.length > height ? lines.slice(lines.length - height) : lines;
	}

	#terminalRows(): number {
		const rows = this.terminalRowsProvider();
		return Number.isFinite(rows) && rows !== undefined && rows > 0 ? Math.trunc(rows) : 24;
	}

	#renderBottom(width: number): string[] {
		const lines: string[] = [];
		for (const component of this.bottomComponents) {
			const rendered = component.render(width);
			for (const line of rendered) lines.push(line);
		}
		return lines;
	}
}
