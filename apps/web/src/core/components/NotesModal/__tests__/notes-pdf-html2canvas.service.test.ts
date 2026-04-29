import { describe, expect, it } from "vitest";

import { getCanvasPageSlices } from "../shared/notes-pdf-html2canvas.service";

describe("getCanvasPageSlices", () => {
  it("keeps short content on a single page", () => {
    expect(
      getCanvasPageSlices({
        canvasHeight: 500,
        canvasWidth: 1000,
        pdfContentHeight: 270,
        pdfContentWidth: 180,
      })
    ).toEqual([{ height: 500, y: 0 }]);
  });

  it("splits long content without losing the final remainder", () => {
    const slices = getCanvasPageSlices({
      canvasHeight: 4000,
      canvasWidth: 1000,
      pdfContentHeight: 270,
      pdfContentWidth: 180,
    });

    expect(slices).toEqual([
      { height: 1500, y: 0 },
      { height: 1500, y: 1500 },
      { height: 1000, y: 3000 },
    ]);
  });
});
