//npm install --save-dev gulp gulp-purgecss gulp-clean-css gulp-terser gulp-clean gulp-cleanhtml jshint gulp-jshint gulp-strip-debug gulp-zip

const gulp = require('gulp')
const purgecss = require('gulp-purgecss')

gulp.task('purgecss', () => {
    return gulp.src(
            'static/assets/**/*.css',
            // 'static/assets/vendors/iconfonts/mdi/css/*.css',
            // 'static/vendor/clockpicker/dist/bootstrap-clockpicker.min.css',
            // 'vendor/mdi/css/materialdesignicons.min.css'
            )
        .pipe(purgecss({
            content: ['static/chrome/*.html','static/index.html', 'static/app/*.html']
        }))
        .pipe(gulp.dest('build/css'))
})