import { defineConfig } from "vitepress";

export default defineConfig({
    lang: 'en-US',
    title: 'Cryb Setup Guide',
    description: 'My setup guide for Cryb',

    head: [
        ['link', { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
        ['script', { defer: '', 'data-domain': 'cryb.d3sox.me', src: 'https://analytics.soundux.rocks/js/script.js' }]
    ],

    lastUpdated: true,
    cleanUrls: true,

    themeConfig: {
        nav: [
            {
                text: 'Installation',
                link: '/installation/',
            },
        ],

        editLink: {
            pattern: 'https://github.com/D3SOX/cryb-guide/edit/master/docs/:path',
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/D3SOX/cryb-guide' },
        ],

        footer: {
            message: 'Made by D3SOX with ❤️',
        },
    },
});
