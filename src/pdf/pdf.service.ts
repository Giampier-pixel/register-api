import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import puppeteer, { Browser } from 'puppeteer';
import type { Tarjeta } from '../tarjetas/schemas/tarjeta.schema';
import { renderTarjetaHtml } from './tarjeta-pdf.template';

@Injectable()
export class PdfService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfService.name);
  private browserPromise: Promise<Browser> | null = null;

  /**
   * Genera el PDF de la tarjeta en memoria (RF-030/031): nunca se
   * escribe a disco; el buffer se envía directo al navegador.
   */
  async generarPdfTarjeta(tarjeta: Tarjeta): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(renderTarjetaHtml(tarjeta), {
        waitUntil: 'load',
      });
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close();
    }
  }

  /**
   * Reutiliza un único Chromium. Las llamadas concurrentes se encadenan
   * sobre la misma promesa para no lanzar navegadores duplicados, y un
   * navegador caído o un lanzamiento fallido se reintentan en la
   * siguiente llamada.
   */
  private getBrowser(): Promise<Browser> {
    const anterior = this.browserPromise ?? Promise.resolve(null);
    this.browserPromise = anterior
      .catch(() => null)
      .then(async (browser) => {
        if (browser?.connected) {
          return browser;
        }
        this.logger.log('Iniciando navegador headless para PDFs');
        return puppeteer.launch({
          headless: true,
          // --disable-dev-shm-usage evita cuelgues de Chromium en contenedores
          // (Render/Docker) donde /dev/shm es muy pequeño.
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
          ],
        });
      });
    return this.browserPromise;
  }

  async onModuleDestroy(): Promise<void> {
    const browser = await this.browserPromise?.catch(() => null);
    await browser?.close();
    this.browserPromise = null;
  }
}
