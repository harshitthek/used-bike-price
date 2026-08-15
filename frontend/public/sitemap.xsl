<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="en">
      <head>
        <title>XML Sitemap | AutoValuate AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;family=Space+Grotesk:wght@600;700&amp;family=JetBrains+Mono:wght@500;700&amp;display=swap" />
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            background-color: #07080b;
            color: #f1f5f9;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            padding: 40px 20px;
            line-height: 1.5;
          }
          .container {
            max-width: 1080px;
            margin: 0 auto;
          }
          .header {
            background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 32px;
            margin-bottom: 28px;
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(12px);
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 9999px;
            background: rgba(99, 102, 241, 0.15);
            border: 1px solid rgba(99, 102, 241, 0.3);
            color: #818cf8;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
          }
          h1 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 8px;
          }
          .desc {
            color: #94a3b8;
            font-size: 14px;
            max-width: 680px;
          }
          .stats {
            display: flex;
            gap: 20px;
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
          }
          .stat-item {
            font-size: 12px;
            color: #64748b;
          }
          .stat-val {
            font-weight: 700;
            color: #38bdf8;
            font-family: 'JetBrains Mono', monospace;
          }
          .table-wrap {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 13px;
          }
          th {
            background: rgba(255, 255, 255, 0.03);
            color: #94a3b8;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
            padding: 14px 18px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
          td {
            padding: 14px 18px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            color: #cbd5e1;
          }
          tr:last-child td {
            border-bottom: none;
          }
          tr:hover td {
            background: rgba(255, 255, 255, 0.02);
          }
          a {
            color: #38bdf8;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.15s;
          }
          a:hover {
            color: #7dd3fc;
            text-decoration: underline;
          }
          .priority-pill {
            display: inline-block;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 6px;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
          }
          .freq-pill {
            display: inline-block;
            font-size: 11px;
            font-weight: 600;
            text-transform: capitalize;
            color: #cbd5e1;
          }
          .date-text {
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: #64748b;
          }
          .footer {
            margin-top: 32px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
          .footer a {
            color: #818cf8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">XML Sitemap</div>
            <h1>AutoValuate AI — Index Manifest</h1>
            <p class="desc">
              This machine-readable XML sitemap is processed by search engine web crawlers (Googlebot, Bingbot, Applebot) to discover canonical pages, priority weighting, and update frequencies.
            </p>
            <div class="stats">
              <div class="stat-item">Total Indexed URLs: <span class="stat-val"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span></div>
              <div class="stat-item">Domain: <span class="stat-val">moto-value-ai.vercel.app</span></div>
              <div class="stat-item">Format: <span class="stat-val">Sitemaps XML 0.9</span></div>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width: 50%;">URL Location</th>
                  <th style="width: 15%;">Change Frequency</th>
                  <th style="width: 15%;">Priority</th>
                  <th style="width: 20%;">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <tr>
                    <td>
                      <xsl:variable name="itemURL">
                        <xsl:value-of select="sitemap:loc"/>
                      </xsl:variable>
                      <a href="{$itemURL}" target="_blank">
                        <xsl:value-of select="sitemap:loc"/>
                      </a>
                    </td>
                    <td>
                      <span class="freq-pill">
                        <xsl:value-of select="sitemap:changefreq"/>
                      </span>
                    </td>
                    <td>
                      <span class="priority-pill">
                        <xsl:value-of select="sitemap:priority"/>
                      </span>
                    </td>
                    <td>
                      <span class="date-text">
                        <xsl:value-of select="sitemap:lastmod"/>
                      </span>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>

          <div class="footer">
            Generated by <a href="/">AutoValuate AI</a> • Dual-Engine Stacking Intelligence • Built by <a href="https://github.com/harshitthek" target="_blank">Harshit (@harshitthek)</a>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
