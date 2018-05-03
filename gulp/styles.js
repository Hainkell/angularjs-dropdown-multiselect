/* eslint-disable import/no-extraneous-dependencies,no-use-before-define,newline-per-chained-call,no-param-reassign,no-mixed-spaces-and-tabs,vars-on-top,no-var,max-len */


const path = require('path');
const gulp = require('gulp');
const conf = require('./conf');

const browserSync = require('browser-sync');

const $ = require('gulp-load-plugins')();

const wiredep = require('wiredep').stream;
const _ = require('lodash');

gulp.task('styles-reload', ['styles'], () => buildStyles()
    .pipe(browserSync.stream()));

gulp.task('styles', () => buildStyles());

var buildStyles = function () {
	const sassOptions = {
		outputStyle: 'expanded',
		precision: 10,
	};

	const injectFiles = gulp.src([
		path.join(conf.paths.src, `${conf.paths.cssRoot}**/*.scss`),
// eslint-disable-next-line prefer-template
		path.join('!' + conf.paths.src, '/app/index.scss'),
		path.join(`!${conf.paths.src}`, '/app/component/index.scss'),
	], { read: false });

	const injectOptions = {
		transform(filePath) {
    	filePath = filePath.replace(`${conf.paths.src}/${conf.paths.cssRoot}`, '');
			return `@import "${filePath}";`;
		},
		starttag: '// injector',
		endtag: '// endinjector',
		addRootSlash: false,
	};

	return gulp.src([
		path.join(conf.paths.src, `${conf.paths.cssRoot}/index.scss`),
	])
    .pipe($.inject(injectFiles, injectOptions))
    .pipe(wiredep(_.extend({}, conf.wiredep)))
    .pipe($.sourcemaps.init())
    .pipe($.autoprefixer()).on('error', conf.errorHandler('Autoprefixer'))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(path.join(conf.paths.tmp, '/serve/app/')));
};
