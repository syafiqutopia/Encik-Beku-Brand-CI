/* ─────────────────────────────────────────────────────────────
 * Encik Beku — language switching
 *
 * EN · Bahasa Melayu · 中文
 *
 * One language per page, never mixed (CI.md §8.3). English lives in the
 * HTML as the fallback, so the page is complete and correct with no JS;
 * this file swaps it wholesale. The choice persists in localStorage and
 * sets <html lang> so screen readers and browser translation behave.
 *
 * TRANSLATION STATUS — read before launch:
 *   ms  first pass, drafted against the Malay already used in the 2026
 *       catalogue ("Harga bermula dari", "Servis Aircond", "Cawangan").
 *   zh  first pass, Simplified.
 * Neither has been reviewed by a native speaker. Company names, the
 * registered entity names, addresses and prices are deliberately NOT
 * translated. Have both reviewed before this goes public.
 * ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var DICT = {
    ms: {
      'nav.about': 'Siapa Kami',
      'nav.brand': 'Jenama Kami',
      'nav.services': 'Perkhidmatan',
      'hero.title': 'Penyelesaian Dipermudah',
      'hero.lede': 'Terokai syarikat kami, identiti jenama dan rangkaian penuh perkhidmatan.',
      'hero.cta': 'Terokai Kisah Kami',
      'pillars.eyebrow': 'Satu laman · tiga perkara',
      'pillars.title': 'Syarikat, identiti, perkhidmatan',
      'pillars.lede': 'Setiap bahagian boleh dibaca terus di laman ini, dan setiap satunya boleh dimuat turun sebagai dokumen untuk disimpan, dicetak atau dikongsi.',
      'p1.title': 'Siapa kami',
      'p1.claim': 'Syarikat di sebalik ekosistem perkhidmatan.',
      'p1.body': 'Ketahui nilai, lokasi dan bagaimana Encik Beku berkembang menjadi penyedia perkhidmatan sehenti.',
      'p1.cta': 'Kenali kami',
      'p2.title': 'Jenama kami',
      'p2.claim': 'Identiti di sebalik Encik Beku.',
      'p2.body': 'Terokai sistem logo, warna, tipografi, bahasa visual dan sumber jenama rasmi kami.',
      'p2.cta': 'Terokai jenama',
      'p3.title': 'Perkhidmatan kami',
      'p3.claim': 'Semua yang kami lakukan, di satu tempat.',
      'p3.body': 'Terokai perkhidmatan penyaman udara, teknikal, hartanah dan pengubahsuaian, termasuk maklumat dan harga.',
      'p3.cta': 'Lihat perkhidmatan',
      'glance.eyebrow': 'Sekilas pandang',
      'glance.title': 'Encik Beku secara ringkas',
      'g.industry': 'Industri',
      'g.industry.v': 'Penyaman udara, perkhidmatan teknikal dan hartanah',
      'g.market': 'Pasaran',
      'g.market.v': 'Malaysia — kediaman dan komersial',
      'g.hq': 'Ibu pejabat',
      'g.hq.v': 'Shah Alam, Selangor',
      'g.regions': 'Kawasan operasi',
      'g.cats': 'Kategori perkhidmatan',
      'g.model': 'Model perkhidmatan',
      'g.model.v': 'Laman perkhidmatan khusus, disokong talian telefon dan mesej terus',
      'g.entities': 'Entiti berdaftar',
      'g.entities.v': 'Tiga syarikat diperbadankan di bawah Akta Syarikat 2016',
      'docs.eyebrow': 'Sumber rasmi',
      'docs.title': 'Dokumen untuk disimpan',
      'docs.lede': 'Setiap dokumen membawa nombor versi dan tarikh kemas kini, supaya anda tahu ia yang terkini.',
      'doc.profile': 'Profil Syarikat Encik Beku',
      'doc.profile.d': 'Gambaran syarikat, visi dan misi, perkhidmatan, lokasi dan maklumat perhubungan setiap cawangan.',
      'doc.brand': 'Garis Panduan Jenama Encik Beku',
      'doc.brand.d': 'Gambaran jenama, sistem logo, ruang lapang, saiz minimum, salah guna, sistem warna dan tipografi.',
      'doc.cat': 'Katalog Perkhidmatan Encik Beku',
      'doc.cat.d': 'Gambaran lengkap perkhidmatan penyaman udara, teknikal dan hartanah, termasuk jadual harga penuh.',
      'doc.preview': 'Pratonton PDF',
      'doc.preview.cat': 'Pratonton katalog',
      'doc.download.cat': 'Muat turun katalog',
      'doc.download': 'Muat turun PDF',
      'doc.pages': 'halaman',
      'doc.updated': 'Dikemas kini 20 Ogos 2026',
      'foot.tagline': 'Sumber rasmi untuk maklumat syarikat, identiti jenama dan sumber perkhidmatan Encik Beku.',
      'foot.sections': 'Bahagian',
      'foot.contact': 'Hubungi'
    },
    zh: {
      'nav.about': '关于我们',
      'nav.brand': '品牌识别',
      'nav.services': '服务项目',
      'hero.title': '化繁为简的解决方案',
      'hero.lede': '了解我们的公司、品牌识别与完整服务范围。',
      'hero.cta': '了解我们的故事',
      'pillars.eyebrow': '一个网站 · 三个板块',
      'pillars.title': '公司、品牌、服务',
      'pillars.lede': '每个板块都可直接在网站上阅读，也可下载为文件保存、打印或分享。',
      'p1.title': '关于我们',
      'p1.claim': '服务生态背后的公司。',
      'p1.body': '了解我们的价值观、据点，以及 Encik Beku 如何发展成一站式服务供应商。',
      'p1.cta': '了解我们',
      'p2.title': '品牌识别',
      'p2.claim': 'Encik Beku 品牌的核心。',
      'p2.body': '了解我们的标志系统、色彩、字体、视觉语言与官方品牌资源。',
      'p2.cta': '了解品牌',
      'p3.title': '服务项目',
      'p3.claim': '我们的全部服务，集中一处。',
      'p3.body': '了解我们的空调、技术、物业与装修服务，包括服务说明与价格。',
      'p3.cta': '查看服务',
      'glance.eyebrow': '公司概览',
      'glance.title': '简要了解 Encik Beku',
      'g.industry': '行业',
      'g.industry.v': '空调、技术与物业服务',
      'g.market': '市场',
      'g.market.v': '马来西亚 — 住宅与商业',
      'g.hq': '总部',
      'g.hq.v': '莎阿南，雪兰莪',
      'g.regions': '营运地区',
      'g.cats': '主要服务类别',
      'g.model': '服务模式',
      'g.model.v': '各类别专属网站，辅以电话与即时通讯咨询',
      'g.entities': '注册公司',
      'g.entities.v': '三家依据 2016 年公司法注册的公司',
      'docs.eyebrow': '官方资源',
      'docs.title': '可保存的文件',
      'docs.lede': '每份文件都标示版本号与更新日期，方便确认是否为最新版本。',
      'doc.profile': 'Encik Beku 公司简介',
      'doc.profile.d': '公司概况、愿景与使命、服务、据点，以及各分行联络方式。',
      'doc.brand': 'Encik Beku 品牌指南',
      'doc.brand.d': '品牌概述、标志系统、留白、最小尺寸、错误用法、色彩系统与字体。',
      'doc.cat': 'Encik Beku 服务目录',
      'doc.cat.d': '空调、技术与物业服务的完整介绍，包含完整价目表。',
      'doc.preview': '预览 PDF',
      'doc.preview.cat': '预览目录',
      'doc.download.cat': '下载目录',
      'doc.download': '下载 PDF',
      'doc.pages': '页',
      'doc.updated': '更新于 2026 年 8 月 20 日',
      'foot.tagline': 'Encik Beku 公司资讯、品牌识别与服务资源的官方来源。',
      'foot.sections': '板块',
      'foot.contact': '联络'
    }
  };

  var KEY = 'eb-lang';
  var buttons = document.querySelectorAll('.langs [data-lang]');
  if (!buttons.length) return;

  // English originals, captured before any swap so switching back is exact.
  var originals = new Map();
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    originals.set(el, el.textContent);
  });

  function apply(lang) {
    var dict = DICT[lang];
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (!dict) { el.textContent = originals.get(el); return; }
      if (dict[k] != null) el.textContent = dict[k];
      // Untranslated keys keep their English text rather than going blank —
      // visible and fixable, instead of silently losing content.
    });
    document.documentElement.setAttribute('lang',
      lang === 'ms' ? 'ms' : lang === 'zh' ? 'zh-Hans' : 'en');
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { apply(b.dataset.lang); });
  });

  var saved;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved && saved !== 'en') apply(saved);
})();
