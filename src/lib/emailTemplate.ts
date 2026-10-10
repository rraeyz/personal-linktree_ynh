// Email Template Generator - Profesyonel HTML Email Şablonu

interface SocialLink {
  platform: string;
  url: string;
  icon: string;
  color: string;
}

interface EmailTemplateOptions {
  subject: string;
  content: string;
  companyName?: string;
  companyAddress?: string;
  companyLogo?: string; // Profil fotoğrafı/logo
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    discord?: string;
    youtube?: string;
    instagram?: string;
    github?: string;
  };
  unsubscribeUrl?: string;
  viewInBrowserUrl?: string;
  // Sitenin dış adresi (https://alanadi.com): ikonlar ve logo için tam adres gerekir
  baseUrl?: string;
}

export function generateEmailHTML(options: EmailTemplateOptions): string {
  const {
    subject,
    content,
    companyName = '',
    companyAddress = '',
    companyLogo = '',
    socialLinks = {},
    unsubscribeUrl,
    viewInBrowserUrl,
    baseUrl = '',
  } = options;

  // Sosyal medya linklerini filtrele ve formatla.
  // İkonlar sunucuda barındırılan PNG: Gmail ne SVG ne de data: URI görselleri gösteriyor.
  const activeSocialLinks: SocialLink[] = [];
  
  if (socialLinks.linkedin) {
    activeSocialLinks.push({
      platform: 'LinkedIn',
      url: socialLinks.linkedin,
      icon: `${baseUrl}/icons/linkedin.png`,
      color: '#0A66C2'
    });
  }
  
  if (socialLinks.twitter) {
    activeSocialLinks.push({
      platform: 'X (Twitter)',
      url: socialLinks.twitter,
      icon: `${baseUrl}/icons/x.png`,
      color: '#000000'
    });
  }
  
  if (socialLinks.discord) {
    activeSocialLinks.push({
      platform: 'Discord',
      url: socialLinks.discord,
      icon: `${baseUrl}/icons/discord.png`,
      color: '#5865F2'
    });
  }
  
  if (socialLinks.youtube) {
    activeSocialLinks.push({
      platform: 'YouTube',
      url: socialLinks.youtube,
      icon: `${baseUrl}/icons/youtube.png`,
      color: '#FF0000'
    });
  }
  
  if (socialLinks.instagram) {
    activeSocialLinks.push({
      platform: 'Instagram',
      url: socialLinks.instagram,
      icon: `${baseUrl}/icons/instagram.png`,
      color: '#E4405F'
    });
  }
  
  if (socialLinks.github) {
    activeSocialLinks.push({
      platform: 'GitHub',
      url: socialLinks.github,
      icon: `${baseUrl}/icons/github.png`,
      color: '#333333'
    });
  }

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-content {
      padding: 40px 30px;
      line-height: 1.6;
      font-size: 16px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .social-section {
      background-color: #2a2a2a;
      padding: 30px;
      text-align: center;
    }
    .social-icons {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin: 20px 0;
    }
    .social-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      font-size: 24px;
      transition: transform 0.2s;
    }
    .social-icon:hover {
      transform: scale(1.1);
    }
    .company-info {
      background-color: #1a1a1a;
      color: #999999;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      line-height: 1.8;
    }
    .company-name {
      color: #ffffff;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .footer-links {
      margin-top: 20px;
    }
    .footer-links a {
      color: #667eea;
      text-decoration: none;
      margin: 0 10px;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
    @media only screen and (max-width: 600px) {
      .email-content {
        padding: 30px 20px;
      }
      .social-section, .company-info {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Ana İçerik -->
    <div class="email-content">
      ${content}
    </div>

    ${activeSocialLinks.length > 0 ? `
    <!-- Sosyal Medya Bölümü -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f9fa; padding: 30px 0;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              ${activeSocialLinks.map(link => `
                <td style="padding: 0 8px;">
                  <!-- Daire bir tablo hücresi: ikon her e-posta istemcisinde yatay ve dikey ortalanır -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="44" height="44" align="center" valign="middle" bgcolor="${link.color}" style="width: 44px; height: 44px; border-radius: 50%; background-color: ${link.color}; text-align: center; vertical-align: middle; line-height: 0; font-size: 0;">
                      <a href="${link.url}" title="${link.platform}" style="display: inline-block; line-height: 0; text-decoration: none;">
                        <img src="${link.icon}" alt="${link.platform}" width="22" height="22" style="display: block; border: 0;" />
                      </a>
                    </td>
                  </tr></table>
                </td>
              `).join('')}
            </tr>
          </table>
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- Şirket Bilgileri ve Footer -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; padding: 30px 0;">
      <tr>
        <td align="center" style="padding: 0 20px;">
          ${companyName ? `
            <div style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
              ${companyName}
            </div>
          ` : ''}
          ${companyAddress ? `
            <div style="color: #666666; font-size: 14px; margin-bottom: 15px;">
              ${companyAddress}
            </div>
          ` : ''}
          
          <div style="margin-top: 20px; color: #888888; font-size: 13px;">
            Bu e-postayı <strong>${unsubscribeUrl ? 'haber bültenimize abone olduğunuz' : 'tarafımızdan gönderildiği'}</strong> için aldınız.
          </div>

          ${(viewInBrowserUrl || unsubscribeUrl) ? `
            <div style="margin-top: 15px; font-size: 13px;">
              ${viewInBrowserUrl ? `<a href="${viewInBrowserUrl}" style="color: #667eea; text-decoration: none;">Tarayıcıda Görüntüle</a>` : ''}
              ${viewInBrowserUrl && unsubscribeUrl ? ' <span style="color: #cccccc;">|</span> ' : ''}
              ${unsubscribeUrl ? `<a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: none;">Abonelikten Çık</a>` : ''}
            </div>
          ` : ''}
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();
}

// Basit text içeriğini HTML'e çevirme yardımcı fonksiyonu
export function textToHTML(text: string): string {
  return text
    .split('\n\n')
    .map(paragraph => {
      let processed = paragraph
        .replace(/\n/g, '<br>')
        // Butonları işle (HTML buton)
        .replace(/<a href="([^"]+)" class="cta-button"[^>]*>([^<]+)<\/a>/g, '<div style="text-align: center; margin: 20px 0;"><a href="$1" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; transition: all 0.3s;">$2</a></div>')
        // Görselleri işle
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<div style="text-align: center; margin: 20px 0;"><img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px;"></div>')
        // Linkleri işle (gömülü link)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #667eea; text-decoration: none; font-weight: 500;">$1</a>')
        // Kalın yazı
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // İtalik yazı (tek yıldız, ama kalın olmayan)
        .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
      
      return `<p style="margin: 0 0 16px 0;">${processed}</p>`
    })
    .join('');
}
