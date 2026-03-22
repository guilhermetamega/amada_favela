import {
  PDFDocument,
  PDFPage,
  StandardFonts,
  rgb,
  type PDFFont,
} from "pdf-lib";
import QRCode from "qrcode";
import type { Association, ProofUserProfile } from "@/types/proof_of_residence";
import {
  buildAssociationAddress,
  buildUserAddress,
  formatDate,
  formatDateTime,
  maskCnpj,
  maskCpf,
} from "@/utils/proof_of_residence";

type GenerateResidenceProofPdfInput = {
  user: ProofUserProfile;
  association: Association;
  issuedAt: string;
  expiresAt: string;
  validationCode: string;
  verificationUrl: string;
  integrityHash: string;
};

type DrawWrappedTextOptions = {
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  font: PDFFont;
  fontSize: number;
  color?: ReturnType<typeof rgb>;
  lineHeight?: number;
};

async function fetchAsUint8Array(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Falha ao carregar arquivo: ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

function isPng(bytes: Uint8Array) {
  return (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

function splitLongWord(
  word: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
) {
  const parts: string[] = [];
  let current = "";

  for (const char of word) {
    const next = current + char;
    const width = font.widthOfTextAtSize(next, fontSize);

    if (width <= maxWidth || current.length === 0) {
      current = next;
    } else {
      parts.push(current);
      current = char;
    }
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
) {
  const paragraphs = text.replace(/\r/g, "").split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const candidateWidth = font.widthOfTextAtSize(candidate, fontSize);

      if (candidateWidth <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }

      const wordWidth = font.widthOfTextAtSize(word, fontSize);

      if (wordWidth <= maxWidth) {
        currentLine = word;
        continue;
      }

      const chunks = splitLongWord(word, font, fontSize, maxWidth);
      for (let i = 0; i < chunks.length; i += 1) {
        if (i < chunks.length - 1) {
          lines.push(chunks[i]);
        } else {
          currentLine = chunks[i];
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function drawWrappedText(page: PDFPage, options: DrawWrappedTextOptions) {
  const {
    text,
    x,
    y,
    maxWidth,
    font,
    fontSize,
    color = rgb(0.12, 0.12, 0.12),
    lineHeight = fontSize * 1.45,
  } = options;

  const lines = wrapText(text, font, fontSize, maxWidth);

  let currentY = y;

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      font,
      size: fontSize,
      color,
    });

    currentY -= lineHeight;
  }

  return {
    lines,
    endY: currentY,
    height: lines.length * lineHeight,
  };
}

function drawLabeledValue(
  page: PDFPage,
  params: {
    label: string;
    value: string;
    x: number;
    y: number;
    width: number;
    labelFont: PDFFont;
    valueFont: PDFFont;
  },
) {
  const { label, value, x, y, width, labelFont, valueFont } = params;

  page.drawText(label, {
    x,
    y,
    font: labelFont,
    size: 10,
    color: rgb(0.42, 0.42, 0.42),
  });

  return drawWrappedText(page, {
    text: value,
    x,
    y: y - 16,
    maxWidth: width,
    font: valueFont,
    fontSize: 11.5,
    lineHeight: 15,
    color: rgb(0.1, 0.1, 0.1),
  });
}

function safeText(value: string | null | undefined, fallback = "-") {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export async function generateResidenceProofPdf(
  input: GenerateResidenceProofPdfInput,
) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const marginX = 46;
  const contentWidth = width - marginX * 2;
  const topY = height - 48;

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(1, 1, 1),
  });

  // Moldura externa sutil
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderWidth: 1,
    borderColor: rgb(0.86, 0.86, 0.86),
  });

  let cursorY = topY;

  // Cabeçalho institucional
  const logoBoxSize = 82;
  const headerTextX = marginX + logoBoxSize + 18;
  const headerTextWidth = width - headerTextX - marginX;

  if (input.association.logo_url) {
    try {
      const logoBytes = await fetchAsUint8Array(input.association.logo_url);
      const embeddedLogo = isPng(logoBytes)
        ? await pdf.embedPng(logoBytes)
        : await pdf.embedJpg(logoBytes);

      const scale = Math.min(
        logoBoxSize / embeddedLogo.width,
        logoBoxSize / embeddedLogo.height,
      );

      const drawWidth = embeddedLogo.width * scale;
      const drawHeight = embeddedLogo.height * scale;

      page.drawImage(embeddedLogo, {
        x: marginX + (logoBoxSize - drawWidth) / 2,
        y: cursorY - drawHeight + 6,
        width: drawWidth,
        height: drawHeight,
      });

      page.drawRectangle({
        x: marginX,
        y: cursorY - logoBoxSize + 6,
        width: logoBoxSize,
        height: logoBoxSize,
        borderWidth: 1,
        borderColor: rgb(0.9, 0.9, 0.9),
      });
    } catch {
      page.drawRectangle({
        x: marginX,
        y: cursorY - logoBoxSize + 6,
        width: logoBoxSize,
        height: logoBoxSize,
        borderWidth: 1,
        borderColor: rgb(0.9, 0.9, 0.9),
      });

      page.drawText("LOGO", {
        x: marginX + 24,
        y: cursorY - 34,
        font: fontBold,
        size: 12,
        color: rgb(0.6, 0.6, 0.6),
      });
    }
  } else {
    page.drawRectangle({
      x: marginX,
      y: cursorY - logoBoxSize + 6,
      width: logoBoxSize,
      height: logoBoxSize,
      borderWidth: 1,
      borderColor: rgb(0.9, 0.9, 0.9),
    });

    page.drawText("LOGO", {
      x: marginX + 24,
      y: cursorY - 34,
      font: fontBold,
      size: 12,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  const headerName = drawWrappedText(page, {
    text: safeText(input.association.name),
    x: headerTextX,
    y: cursorY,
    maxWidth: headerTextWidth,
    font: fontBold,
    fontSize: 16,
    lineHeight: 20,
    color: rgb(0.08, 0.08, 0.08),
  });

  const headerCnpjY = headerName.endY - 2;

  page.drawText(`CNPJ: ${maskCnpj(input.association.cnpj)}`, {
    x: headerTextX,
    y: headerCnpjY,
    font: fontRegular,
    size: 10.5,
    color: rgb(0.22, 0.22, 0.22),
  });

  const assocAddress = buildAssociationAddress(input.association);
  const headerAddress = drawWrappedText(page, {
    text: assocAddress,
    x: headerTextX,
    y: headerCnpjY - 16,
    maxWidth: headerTextWidth,
    font: fontRegular,
    fontSize: 9.5,
    lineHeight: 13,
    color: rgb(0.35, 0.35, 0.35),
  });

  const headerBottomY = Math.min(
    cursorY - logoBoxSize - 6,
    headerAddress.endY - 8,
  );

  page.drawLine({
    start: { x: marginX, y: headerBottomY },
    end: { x: width - marginX, y: headerBottomY },
    thickness: 1,
    color: rgb(0.88, 0.88, 0.88),
  });

  cursorY = headerBottomY - 30;

  // Título
  const title = "DECLARAÇÃO DE RESIDÊNCIA";
  const titleWidth = fontBold.widthOfTextAtSize(title, 18);

  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: cursorY,
    font: fontBold,
    size: 18,
    color: rgb(0.08, 0.08, 0.08),
  });

  cursorY -= 34;

  // Corpo principal
  const legalText =
    `A ${safeText(input.association.name)}, inscrita no CNPJ sob o nº ${maskCnpj(input.association.cnpj)}, ` +
    `declara, para os devidos fins, que ${safeText(input.user.fullname)}, inscrito(a) no CPF sob o nº ${maskCpf(input.user.cpf)}, ` +
    `encontra-se cadastrado(a) como residente no seguinte endereço ${buildUserAddress(input.user)}.`;

  const body = drawWrappedText(page, {
    text: legalText,
    x: marginX,
    y: cursorY,
    maxWidth: contentWidth,
    font: fontRegular,
    fontSize: 11.5,
    lineHeight: 18,
    color: rgb(0.12, 0.12, 0.12),
  });

  cursorY = body.endY - 22;

  // Caixa de dados do associado
  const infoBoxTop = cursorY;
  const infoBoxHeight = 116;

  page.drawRectangle({
    x: marginX,
    y: infoBoxTop - infoBoxHeight,
    width: contentWidth,
    height: infoBoxHeight,
    borderWidth: 1,
    borderColor: rgb(0.9, 0.9, 0.9),
    color: rgb(0.985, 0.985, 0.985),
  });

  const colGap = 18;
  const leftColX = marginX + 16;
  const rightColX = marginX + contentWidth / 2 + colGap / 2;
  const colWidth = contentWidth / 2 - 16 - colGap / 2;

  drawLabeledValue(page, {
    label: "NOME",
    value: safeText(input.user.fullname),
    x: leftColX,
    y: infoBoxTop - 18,
    width: colWidth,
    labelFont: fontBold,
    valueFont: fontRegular,
  });

  drawLabeledValue(page, {
    label: "CPF",
    value: maskCpf(input.user.cpf),
    x: rightColX,
    y: infoBoxTop - 18,
    width: colWidth,
    labelFont: fontBold,
    valueFont: fontRegular,
  });

  drawLabeledValue(page, {
    label: "ENDEREÇO COMPLETO",
    value: buildUserAddress(input.user),
    x: leftColX,
    y: infoBoxTop - 64,
    width: contentWidth - 32,
    labelFont: fontBold,
    valueFont: fontRegular,
  });

  cursorY = infoBoxTop - infoBoxHeight - 24;

  // Emissão / validade
  page.drawText(`Emitido em: ${formatDateTime(input.issuedAt)}`, {
    x: marginX,
    y: cursorY,
    font: fontRegular,
    size: 10.5,
    color: rgb(0.15, 0.15, 0.15),
  });

  page.drawText(`Válido até: ${formatDate(input.expiresAt)}`, {
    x: width - marginX - 150,
    y: cursorY,
    font: fontRegular,
    size: 10.5,
    color: rgb(0.15, 0.15, 0.15),
  });

  cursorY -= 28;

  // Bloco de validação
  const validationBoxHeight = 126;

  page.drawRectangle({
    x: marginX,
    y: cursorY - validationBoxHeight,
    width: contentWidth,
    height: validationBoxHeight,
    borderWidth: 1,
    borderColor: rgb(0.88, 0.88, 0.88),
  });

  const qrDataUrl = await QRCode.toDataURL(input.verificationUrl, {
    margin: 0,
    width: 160,
  });

  const qrBase64 = qrDataUrl.split(",")[1];
  const qrBytes = Uint8Array.from(atob(qrBase64), (char) => char.charCodeAt(0));
  const qrImage = await pdf.embedPng(qrBytes);

  const qrSize = 88;
  const qrX = marginX + 16;
  const qrY = cursorY - validationBoxHeight + 19;

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  const validationTextX = qrX + qrSize + 18;
  const validationTextWidth = contentWidth - (validationTextX - marginX) - 16;

  page.drawText("Validação digital", {
    x: validationTextX,
    y: cursorY - 24,
    font: fontBold,
    size: 12.5,
    color: rgb(0.08, 0.08, 0.08),
  });

  drawWrappedText(page, {
    text: `Código: ${input.validationCode}`,
    x: validationTextX,
    y: cursorY - 44,
    maxWidth: validationTextWidth,
    font: fontRegular,
    fontSize: 10,
    lineHeight: 13,
    color: rgb(0.15, 0.15, 0.15),
  });

  drawWrappedText(page, {
    text: "Valide este documento pelo QR Code ou pela tela de validação da plataforma.",
    x: validationTextX,
    y: cursorY - 62,
    maxWidth: validationTextWidth,
    font: fontRegular,
    fontSize: 9.5,
    lineHeight: 12,
    color: rgb(0.35, 0.35, 0.35),
  });

  cursorY -= validationBoxHeight + 24;

  // Assinatura
  const signatureBlockTop = cursorY;
  const signatureLineWidth = 210;
  const signatureX = width - marginX - signatureLineWidth;

  if (input.association.signature_url) {
    try {
      const signatureBytes = await fetchAsUint8Array(
        input.association.signature_url,
      );
      const embeddedSignature = isPng(signatureBytes)
        ? await pdf.embedPng(signatureBytes)
        : await pdf.embedJpg(signatureBytes);

      const maxSignWidth = 170;
      const maxSignHeight = 52;
      const signScale = Math.min(
        maxSignWidth / embeddedSignature.width,
        maxSignHeight / embeddedSignature.height,
      );

      const signWidth = embeddedSignature.width * signScale;
      const signHeight = embeddedSignature.height * signScale;

      page.drawImage(embeddedSignature, {
        x: signatureX + (signatureLineWidth - signWidth) / 2,
        y: signatureBlockTop - 10,
        width: signWidth,
        height: signHeight,
      });
    } catch {
      // segue sem imagem
    }
  }

  page.drawLine({
    start: { x: signatureX, y: signatureBlockTop - 18 },
    end: { x: signatureX + signatureLineWidth, y: signatureBlockTop - 18 },
    thickness: 1,
    color: rgb(0.25, 0.25, 0.25),
  });

  const signName = drawWrappedText(page, {
    text: safeText(input.association.president_name),
    x: signatureX,
    y: signatureBlockTop - 34,
    maxWidth: signatureLineWidth,
    font: fontBold,
    fontSize: 10.5,
    lineHeight: 13,
    color: rgb(0.12, 0.12, 0.12),
  });

  const signRole = drawWrappedText(page, {
    text: safeText("Presidente"),
    x: signatureX,
    y: signName.endY - 2,
    maxWidth: signatureLineWidth,
    font: fontRegular,
    fontSize: 9.5,
    lineHeight: 12,
    color: rgb(0.35, 0.35, 0.35),
  });

  drawWrappedText(page, {
    text: safeText(input.association.name),
    x: signatureX,
    y: signRole.endY - 2,
    maxWidth: signatureLineWidth,
    font: fontRegular,
    fontSize: 9,
    lineHeight: 11,
    color: rgb(0.35, 0.35, 0.35),
  });

  // Local/data no lado esquerdo da assinatura
  drawWrappedText(page, {
    text: `${safeText(input.association.name)}\n${formatDate(input.issuedAt)}`,
    x: marginX,
    y: signatureBlockTop - 18,
    maxWidth: 180,
    font: fontRegular,
    fontSize: 10,
    lineHeight: 14,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Observação legal no rodapé
  const footerText =
    "Observação: declaração emitida com base nas informações cadastrais do associado, sob as penas da lei, para fins de comprovação de residência.";

  drawWrappedText(page, {
    text: footerText,
    x: marginX,
    y: 70,
    maxWidth: contentWidth,
    font: fontRegular,
    fontSize: 8.2,
    lineHeight: 11,
    color: rgb(0.42, 0.42, 0.42),
  });

  return pdf.save();
}
