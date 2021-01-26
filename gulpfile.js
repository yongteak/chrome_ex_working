//npm install --save-dev gulp gulp-purgecss gulp-clean-css gulp-terser gulp-clean gulp-cleanhtml jshint gulp-jshint gulp-strip-debug gulp-zip

var gulp = require('gulp');
var mainBowerFiles = require('gulp-main-bower-files');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var gulpFilter = require('gulp-filter');
var minifyJS = require('gulp-minify');
var less = require('gulp-less');

var input = {
    'js': 'static/assets/**/*.js',
    'css': 'static/assets/**/*.css'
};
var output = {
    'js': 'public/assets/js',
    'css': 'public/assets/css'
};

gulp.task('minify-css', function () {
    return gulp.src('static/assets/**/*.css')
        .pipe(minifyCSS())
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('dist/css'))
});

gulp.task('scripts', function () {
    return gulp.src('static/app/**/*.js')
        .pipe(concat('main.js'))
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('copyHtml', function () {
    return gulp.src('static/html/*.html')
        .pipe(gulp.dest('public'));
});

//
gulp.task('copyApp', function () {
    return gulp.src(['static/**/*.*', '!static/vendor/**', '!static/assets/css/**', '!static/assets/vendors/**'], {base:"static/"})
        .pipe(gulp.dest('dist'));
});

gulp.task('main-bower-files', function () {
    var filterJS = gulpFilter(['*', '**/*.js','!**/*.min.js'], { restore: true });
    var filterCSS = gulpFilter('**/*.less', { restore: true });
    return gulp.src('./bower.json')
        .pipe(mainBowerFiles())
        .pipe(filterJS)
        .pipe(uglify())
        .pipe(filterJS.restore)

        .pipe(filterCSS)
        .pipe(less())
        .pipe(minifyCSS())
        .pipe(filterCSS.restore)

        .pipe(gulp.dest('dist/bower_components'));
        // .pipe(filter('*.js'))
        // // .pipe(filter(['*', '!**/*.min.js'], { 'restore': true }))
        // .pipe(uglify())
        // .pipe(concat('lib.js'))
        // .pipe(gulp.dest('public'))
        // // .pipe(gulp.dest(output.js));
});

gulp.task('default', gulp.series('main-bower-files','copyHtml'));

// gulp.task('default', gulp.series('bower-concat'));

gulp.task('purgecss', () => {
    return gulp.src(
        'static/assets/**/*.css',
        // 'static/assets/vendors/iconfonts/mdi/css/*.css',
        // 'static/vendor/clockpicker/dist/bootstrap-clockpicker.min.css',
        // 'vendor/mdi/css/materialdesignicons.min.css'
    )
        .pipe(purgecss({
            content: ['static/chrome/*.html', 'static/index.html', 'static/app/*.html']
        }))
        .pipe(gulp.dest('build/css'))
})