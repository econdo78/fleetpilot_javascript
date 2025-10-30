import gulp from 'gulp';

import { create as bsCreate } from 'browser-sync';
const browserSync = bsCreate();

import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);

import sourcemaps from 'gulp-sourcemaps';
import cleanCSS from 'gulp-clean-css';
import injectPartials from 'gulp-inject-partials';
import { deleteAsync } from 'del';
import concat from 'gulp-concat';
import merge from 'merge-stream';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rename from 'gulp-rename';
import rtlcss from 'gulp-rtlcss';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.dirname(__filename);
const htmlPages = readdirSync(projectRoot)
  .filter((file) => file.endsWith('.html'))
  .map((file) => path.join(projectRoot, file));

const paths = {
  styles: {
    entry: 'assets/scss/style.scss',
    watch: 'assets/scss/**/*.scss',
    dest: 'assets/css',
  },
  html: {
    pages: htmlPages,
    watch: './*.html',
    partials: 'partials/**/*.html',
  },
  scripts: 'assets/js/**/*.js',
};

const disableBrowserSync =
  ['true', '1', 'yes'].includes(
    String(process.env.DISABLE_BROWSER_SYNC ?? process.env.BROWSER_SYNC_DISABLE ?? '').toLowerCase(),
  ) || process.env.CI === 'true';

function isBrowserSyncPermissionError(err) {
  if (!err) {
    return false;
  }
  if (err.code && ['EACCES', 'EADDRINUSE', 'EPERM'].includes(err.code)) {
    return true;
  }
  if (typeof err.message === 'string' && err.message.toLowerCase().includes('aggregateerror')) {
    return true;
  }
  const stack = err.stack || '';
  return /EACCES|EADDRINUSE|EPERM/i.test(stack);
}

function styles() {
  return gulp
    .src(paths.styles.entry)
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        includePaths: ['node_modules'],
      }).on('error', sass.logError),
    )
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(browserSync.stream());
}

function stylesRtl() {
  return gulp
    .src(paths.styles.entry)
    .pipe(
      sass({
        includePaths: ['node_modules'],
      }).on('error', sass.logError),
    )
    .pipe(rtlcss())
    .pipe(rename({ suffix: '-rtl' }))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(browserSync.stream());
}

function partials() {
  return gulp
    .src(paths.html.pages, { base: projectRoot, allowEmpty: true })
    .pipe(
      injectPartials({
        removeTags: false,
      }),
    )
    .pipe(gulp.dest('.'));
}

function reload(done) {
  if (browserSync.active) {
    browserSync.reload();
  }
  if (typeof done === 'function') {
    done();
  }
}

function serveTask(done) {
  const startWatchers = () => {
    const triggerReload = () => reload();

    gulp.watch(paths.styles.watch, styles);
    gulp.watch(paths.html.partials, gulp.series(partials, reload));
    gulp.watch(paths.html.watch).on('change', triggerReload);
    gulp.watch('assets/i18n/**/*.json').on('change', triggerReload);
    gulp.watch(paths.scripts).on('change', triggerReload);
  };

  if (disableBrowserSync) {
    console.warn('BrowserSync disabled by environment; running in watch-only mode.');
    startWatchers();
    done();
    return;
  }

  browserSync.init(
    {
      server: {
        baseDir: './',
        middleware: [
          createProxyMiddleware('/fm-api', {
            target: 'https://preproduccion.fleetpad.app',
            changeOrigin: true,
            secure: false,
            logLevel: 'silent',
            pathRewrite: { '^/fm-api': '/fmi/data/vLatest/databases/fleetpilot' },
          }),
        ],
      },
      startPath: 'login.html',
      notify: false,
      ghostMode: false,
    },
    (err) => {
      if (err) {
        console.error('BrowserSync initialization failed:', err);
        if (err && Array.isArray(err.errors) && err.errors.length > 0) {
          err.errors.forEach((nestedErr) => {
            console.error('  nested error:', nestedErr);
          });
        }
        if (isBrowserSyncPermissionError(err)) {
          console.warn('Continuing without BrowserSync. Live reload is disabled.');
          startWatchers();
          done();
        } else {
          done(err);
        }
        return;
      }

      startWatchers();

      done();
    },
  );
}

const build = gulp.series(partials, gulp.parallel(styles));

// ---------------------------------------------------------------------------
// Vendor helper tasks (unchanged)
// ---------------------------------------------------------------------------

function cleanVendors() {
  return deleteAsync(['./assets/vendors/**/*']);
}

function buildCoreCss() {
  return gulp
    .src(['./node_modules/perfect-scrollbar/css/perfect-scrollbar.css'])
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(concat('core.css'))
    .pipe(gulp.dest('./assets/vendors/core'));
}

function buildCoreJs() {
  return gulp
    .src([
      './node_modules/lucide/dist/umd/lucide.min.js',
      './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
      './node_modules/perfect-scrollbar/dist/perfect-scrollbar.min.js',
    ])
    .pipe(concat('core.js'))
    .pipe(gulp.dest('./assets/vendors/core'));
}

function copyAddons() {
  const mdi_font = gulp
    .src('./node_modules/@mdi/font/css/materialdesignicons.min.css')
    .pipe(gulp.dest('./assets/vendors/mdi/css'));
  const mdi_font_files = gulp
    .src('./node_modules/@mdi/font/fonts/*')
    .pipe(gulp.dest('./assets/vendors/mdi/fonts'));
  const simonwep_pickr = gulp
    .src('./node_modules/@simonwep/pickr/dist/pickr.min.js')
    .pipe(gulp.dest('./assets/vendors/pickr'));
  const simonwep_pickr_themes = gulp
    .src('./node_modules/@simonwep/pickr/dist/themes/*')
    .pipe(gulp.dest('./assets/vendors/pickr/themes'));
  const ace_builds = gulp
    .src('./node_modules/ace-builds/src-min/**/*')
    .pipe(gulp.dest('./assets/vendors/ace-builds/src-min'));
  const animate_css = gulp
    .src('./node_modules/animate.css/animate.min.css')
    .pipe(gulp.dest('./assets/vendors/animate.css'));
  const apexcharts = gulp
    .src('./node_modules/apexcharts/dist/apexcharts.min.js')
    .pipe(gulp.dest('./assets/vendors/apexcharts'));
  const bootstrap_maxlength = gulp
    .src('./node_modules/bootstrap-maxlength/dist/bootstrap-maxlength.min.js')
    .pipe(gulp.dest('./assets/vendors/bootstrap-maxlength'));
  const chart_js = gulp
    .src('./node_modules/chart.js/dist/chart.umd.js')
    .pipe(gulp.dest('./assets/vendors/chartjs'));
  const clipboard = gulp
    .src('./node_modules/clipboard/dist/clipboard.min.js')
    .pipe(gulp.dest('./assets/vendors/clipboard'));
  const cropperjs = gulp
    .src([
      './node_modules/cropperjs/dist/cropper.min.css',
      './node_modules/cropperjs/dist/cropper.min.js',
    ])
    .pipe(gulp.dest('./assets/vendors/cropperjs'));
  const dropify = gulp
    .src([
      './node_modules/dropify/dist/css/dropify.min.css',
      './node_modules/dropify/dist/js/dropify.min.js',
    ])
    .pipe(gulp.dest('./assets/vendors/dropify/dist'));
  const dropify_fonts = gulp
    .src('./node_modules/dropify/dist/fonts/*')
    .pipe(gulp.dest('./assets/vendors/dropify/fonts'));
  const dropzone = gulp
    .src([
      './node_modules/dropzone/dist/dropzone.css',
      './node_modules/dropzone/dist/dropzone-min.js',
    ])
    .pipe(gulp.dest('./assets/vendors/dropzone'));
  const easymde = gulp
    .src([
      './node_modules/easymde/dist/easymde.min.css',
      './node_modules/easymde/dist/easymde.min.js',
    ])
    .pipe(gulp.dest('./assets/vendors/easymde'));
  const flag_icon_css = gulp
    .src('./node_modules/flag-icons/css/flag-icons.min.css')
    .pipe(gulp.dest('./assets/vendors/flag-icons/css'));
  const flag_icon_css_files = gulp
    .src('./node_modules/flag-icons/flags/**/*')
    .pipe(gulp.dest('./assets/vendors/flag-icons/flags'));
  const flatpickr = gulp
    .src([
      './node_modules/flatpickr/dist/flatpickr.min.css',
      './node_modules/flatpickr/dist/flatpickr.min.js',
    ])
    .pipe(gulp.dest('./assets/vendors/flatpickr'));
  const font_awesome = gulp
    .src('./node_modules/font-awesome/css/font-awesome.min.css')
    .pipe(gulp.dest('./assets/vendors/font-awesome/css'));
  const font_awesome_files = gulp
    .src('./node_modules/font-awesome/fonts/*')
    .pipe(gulp.dest('./assets/vendors/font-awesome/fonts'));
  const fullcalendar = gulp
    .src('./node_modules/fullcalendar/index.global.min.js')
    .pipe(gulp.dest('./assets/vendors/fullcalendar'));
  const inputmask = gulp
    .src('./node_modules/inputmask/dist/jquery.inputmask.min.js')
    .pipe(gulp.dest('./assets/vendors/inputmask'));
  const jquery = gulp
    .src('./node_modules/jquery/dist/jquery.min.js')
    .pipe(gulp.dest('./assets/vendors/jquery'));
  const jquery_mousewheel = gulp
    .src('./node_modules/jquery-mousewheel/jquery.mousewheel.js')
    .pipe(gulp.dest('./assets/vendors/jquery-mousewheel'));
  const jquery_sparkline = gulp
    .src('./node_modules/jquery-sparkline/jquery.sparkline.min.js')
    .pipe(gulp.dest('./assets/vendors/jquery-sparkline'));
  const jquery_steps = gulp
    .src([
      './node_modules/jquery-steps/demo/css/jquery.steps.css',
      './node_modules/jquery-steps/build/jquery.steps.min.js',
    ])
    .pipe(gulp.dest('./assets/vendors/jquery-steps'));
  const jquery_tags_input = gulp
    .src('./node_modules/jquery-tags-input/dist/*')
    .pipe(gulp.dest('./assets/vendors/jquery-tags-input'));
  const jquery_validation = gulp
    .src('./node_modules/jquery-validation/dist/jquery.validate.min.js')
    .pipe(gulp.dest('./assets/vendors/jquery-validation'));
  const jquery_flot = gulp
    .src([
      './node_modules/jquery.flot/jquery.flot.js',
      './node_modules/jquery.flot/jquery.flot.resize.js',
      './node_modules/jquery.flot/jquery.flot.pie.js',
      './node_modules/jquery.flot/jquery.flot.categories.js',
    ])
    .pipe(gulp.dest('./assets/vendors/jquery.flot'));
  const moment = gulp
    .src('./node_modules/moment/min/moment.min.js')
    .pipe(gulp.dest('./assets/vendors/moment'));
  const owl_carousel = gulp
    .src([
      './node_modules/owl.carousel/dist/assets/owl.carousel.min.css',
      './node_modules/owl.carousel/dist/assets/owl.theme.default.min.css',
      './node_modules/owl.carousel/dist/owl.carousel.min.js',
    ])
    .pipe(gulp.dest('./assets/vendors/owl.carousel'));
  const peity = gulp
    .src('./node_modules/peity/jquery.peity.min.js')
    .pipe(gulp.dest('./assets/vendors/peity'));
  const prismjs = gulp
    .src('./node_modules/prismjs/prism.js')
    .pipe(gulp.dest('./assets/vendors/prismjs'));
  const prismjs_themes = gulp
    .src('./node_modules/prism-themes/themes/prism-coldark-dark.css')
    .pipe(gulp.dest('./assets/vendors/prism-themes'));
  const select2 = gulp
    .src([
      './node_modules/select2/dist/css/select2.min.css',
      './node_modules/select2/dist/js/select2.min.js',
    ])
    .pipe(gulp.dest('./assets/vendors/select2'));
  const sortablejs = gulp
    .src('./node_modules/sortablejs/Sortable.min.js')
    .pipe(gulp.dest('./assets/vendors/sortablejs'));
  const sweetalert2 = gulp
    .src([
      './node_modules/sweetalert2/dist/sweetalert2.min.css',
      './node_modules/sweetalert2/dist/sweetalert2.min.js',
    ])
    .pipe(gulp.dest('./assets/vendors/sweetalert2'));
  const tinymce = gulp
    .src('./node_modules/tinymce/**/*')
    .pipe(gulp.dest('./assets/vendors/tinymce'));
  const typeahead_js = gulp
    .src('./node_modules/typeahead.js/dist/typeahead.bundle.min.js')
    .pipe(gulp.dest('./assets/vendors/typeahead.js'));

  return merge(
    ace_builds,
    animate_css,
    apexcharts,
    bootstrap_maxlength,
    chart_js,
    clipboard,
    cropperjs,
    dropify,
    dropify_fonts,
    dropzone,
    easymde,
    flag_icon_css,
    flag_icon_css_files,
    flatpickr,
    font_awesome,
    font_awesome_files,
    fullcalendar,
    inputmask,
    jquery,
    jquery_mousewheel,
    jquery_sparkline,
    jquery_steps,
    jquery_tags_input,
    jquery_validation,
    jquery_flot,
    mdi_font,
    mdi_font_files,
    moment,
    owl_carousel,
    peity,
    prismjs,
    prismjs_themes,
    select2,
    simonwep_pickr,
    simonwep_pickr_themes,
    sortablejs,
    sweetalert2,
    tinymce,
    typeahead_js,
  );
}

const copyVendors = gulp.series(cleanVendors, buildCoreCss, buildCoreJs, copyAddons);

// ---------------------------------------------------------------------------
// Public tasks
// ---------------------------------------------------------------------------

const serve = gulp.series(build, serveTask);
const buildRtl = gulp.series(partials, gulp.parallel(styles, stylesRtl));

gulp.task('styles', styles);
gulp.task('styles:rtl', stylesRtl);
gulp.task('partials', partials);
gulp.task('build', build);
gulp.task('build:rtl', buildRtl);
gulp.task('copyVendors', copyVendors);
gulp.task('serve', serve);
gulp.task('default', serve);
