import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.1,
      cdn: 'https://esm.sh/',
    }),
    presetTypography({
      cssExtend: {
        'ul,ol': {
          'padding-left': '2.25em',
          'position': 'relative',
        },
      },
    }),
  ],
  transformers: [transformerVariantGroup(), transformerDirectives()],
  shortcuts: [{
    'fc': 'flex justify-center',
    'fi': 'flex items-center',
    'fb': 'flex justify-between',
    'fcc': 'fc items-center',
    'fie': 'fi justify-end',
    'col-fcc': 'flex-col fcc',
    'inline-fcc': 'inline-flex items-center justify-center',
    'base-focus': 'focus:(bg-op-20 ring-0 outline-none)',
    'b-slate-link': 'border-b border-(slate none) hover:border-dashed',
    'gpt-title': 'text-2xl font-extrabold mr-1',
    'gpt-subtitle': 'text-(2xl transparent) font-extrabold bg-(clip-text gradient-to-r) from-sky-400 to-emerald-600',
    'gpt-copy-btn': 'absolute top-12px right-12px z-3 fcc border b-transparent w-8 h-8 p-2 bg-light-300 dark:bg-dark-300 op-90 cursor-pointer',
    'gpt-copy-tips': 'op-0 h-7 bg-black px-2.5 py-1 box-border text-xs c-white fcc rounded absolute z-1 transition duration-600 whitespace-nowrap -top-8',
    'gpt-retry-btn': 'fi gap-1 px-2 py-0.5 op-70 border border-slate rounded-md text-sm cursor-pointer hover:bg-slate/10',
    'gpt-back-top-btn': 'fcc p-2.5 text-base rounded-md hover:bg-slate/10 fixed bottom-60px right-8px z-10 cursor-pointer transition-colors',
    'gpt-back-bottom-btn': 'gpt-back-top-btn bottom-20px transform-rotate-180deg',
    'gpt-password-input': 'px-4 py-3 h-12 rounded-sm bg-(slate op-15) base-focus',
    'gpt-password-submit': 'fcc h-12 w-12 bg-slate cursor-pointer bg-op-20 hover:bg-op-50',
    'gen-slate-btn': 'h-12 px-4 py-2 bg-(slate op-15) hover:bg-op-20 rounded-sm',
    'gen-cb-wrapper': 'h-12 my-4 fcc gap-4 bg-(slate op-15) rounded-sm',
    'gen-cb-stop': 'px-2 py-0.5 border border-slate rounded-md text-sm op-70 cursor-pointer hover:bg-slate/10',
    'gen-text-wrapper': 'my-4 fixed bottom-[0] left-[0] w-full p-r-[1rem] p-l-[1rem] bg-[#ffffff] p-b-4 mb-0 w-full',
    'gen-text-conent': 'max-w-[700px] fc gap-2',
    'gen-textarea': 'w-full px-3 py-3 min-h-12 max-h-36 rounded-sm bg-(slate op-15) resize-none base-focus placeholder:op-50 dark:(placeholder:op-30) scroll-pa-8px',
    'gen-text-speak-but': 'w-full touch-none select-none w-full px-3 py-3 min-h-12 max-h-36 rounded-sm resize-none base-focus placeholder:op-50 scroll-pa-8px cursor-pointer border border-(slate op-15) text-center',
    'gen-text-wrapper-ing': 'fixed z-99 w-full h-26 bg-[#f1f1f1] bottom-[0] left-[0] b-rd-t-80% text-center line-height-20 text-3',
    'sys-edit-btn': 'inline-fcc gap-1 text-sm bg-slate/20 px-2 py-1 rounded-md transition-colors cursor-pointer hover:bg-slate/50',
    'gen-text-speak': 'w-36px h-36px m-t-6px cursor-pointer',
    'gen-speak-gray': 'fixed w-full h-full bg-[#fefefe] top-[0] left-[0] z-50 op-80',
    'gen-text-wrapper-close': 'fixed bg-[#515151] w-20 h-20 b-rd-50% bottom-34 left-20 -ml-8 text-center z-55',
    'gen-text-wrapper-text': 'fixed bg-[#515151] w-20 h-20 b-rd-50% bottom-34 right-14 -ml-8 text-center z-55',
    'gen-text-close-icon': 'w-5 h-5',
  }],
})

// position: fixed;
// z-index: 99;
// width: 100%;
// height: 100px;
// background: #f1f1f1;
// bottom: 0;
// left: 0;
// border-radius: 50% 50% 0 0;
// text-align: center;
// line-height: 100px;
// font-size: 13px;
// }