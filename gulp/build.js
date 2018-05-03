/* eslint-disable import/no-extraneous-dependencies,no-mixed-spaces-and-tabs,newline-per-chained-call,import/no-dynamic-require,global-require */


const path = require('path');
const gulp = require('gulp');
const runSequence = require('run-sequence');
const concat = require('gulp-concat');
const conf = require('./conf');

const $ = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del'],
});

gulp.task('partials', () => gulp.src([
	path.join(conf.paths.src, conf.paths.template),
	path.join(conf.paths.tmp, '/serve/app/**/*.html'),
])
    .pipe($.htmlmin({
    	removeEmptyAttributes: true,
    	removeAttributeQuotes: true,
    	collapseBooleanAttributes: true,
    	collapseWhitespace: true,
}))
    .pipe($.angularTemplatecache('templateCacheHtml.js', {
    	module: conf.names.module,
    	root: conf.paths.templateRoot,
}))
    .pipe(gulp.dest(`${conf.paths.tmp}/partials/`)));

gulp.task('html', ['inject', 'partials'], () => {
	const partialsInjectFile = gulp.src(path.join(conf.paths.tmp, '/partials/templateCacheHtml.js'), { read: false });
	const partialsInjectOptions = {
		starttag: '<!-- inject:partials -->',
		ignorePath: path.join(conf.paths.tmp, '/partials'),
		addRootSlash: false,
	};

	const htmlFilter = $.filter('*.html', { restore: true });
	const jsFilter = $.filter('**/*.js', { restore: true });
	const cssFilter = $.filter('**/*.css', { restore: true });

	return gulp.src(path.join(conf.paths.tmp, '/serve/*.html'))
    .pipe($.inject(partialsInjectFile, partialsInjectOptions))
    .pipe($.useref())
    .pipe(jsFilter)
    .pipe($.sourcemaps.init())
    .pipe($.uglify({ preserveComments: $.uglifySaveLicense })).on('error', conf.errorHandler('Uglify'))
    .pipe($.sourcemaps.write('maps'))
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    // .pipe($.sourcemaps.init())
    .pipe($.replace('../../bower_components/bootstrap-sass/assets/fonts/bootstrap/', '../fonts/'))
    .pipe($.cssnano())
    // .pipe($.sourcemaps.write('maps'))
    .pipe(cssFilter.restore)
    .pipe(htmlFilter)
    .pipe($.htmlmin({
    	removeEmptyAttributes: true,
    	removeAttributeQuotes: true,
    	collapseBooleanAttributes: true,
    	collapseWhitespace: true,
}))
    .pipe(htmlFilter.restore)
    .pipe(gulp.dest(path.join(conf.paths.dist, '/')))
    .pipe($.size({ title: path.join(conf.paths.dist, '/'), showFiles: true }));
});

// Only applies for fonts from bower dependencies
// Custom fonts are handled by the "other" task
gulp.task('fonts', () => gulp.src($.mainBowerFiles({
	paths: {
		bowerJson: 'bowerDocs.json',
	},
}))
    .pipe($.filter('**/*.{eot,otf,svg,ttf,woff,woff2}'))
    .pipe($.flatten())
    .pipe(gulp.dest(path.join(conf.paths.dist, '/fonts/'))));

gulp.task('other', () => {
	const fileFilter = $.filter(file => file.stat.isFile());

	return gulp.src([
		path.join(conf.paths.src, '/**/*'),
		path.join(`!${conf.paths.src}`, '/**/*.{html,css,js,scss}'),
	])
    .pipe(fileFilter)
    .pipe(gulp.dest(path.join(conf.paths.dist, '/')));
});

gulp.task('clean', () => $.del([path.join(conf.paths.dist, '/'), path.join(conf.paths.tmp, '/')]));

gulp.task('build', ['html', 'fonts', 'other']);

gulp.task('conf:component', (cb) => {
	conf.paths.src = 'src/app/component';
	conf.paths.dist = 'dist';
	conf.paths.template = '**/*.html';
	conf.paths.index = 'angularjs-dropdown-multiselect.module.js';
	conf.paths.templateRoot = 'app/component/';
	conf.paths.cssRoot = '';
	conf.paths.bowerJson = '../bower.json';
	conf.names.module = 'angularjs-dropdown-multiselect';
	conf.wiredep.bowerJson = require(conf.paths.bowerJson);
	cb();
});

gulp.task('clean:component', ['conf:component'], () => $.del([path.join(conf.paths.dist, '/'), path.join(conf.paths.tmp, '/')]));

gulp.task('compile:component', ['clean:component'], (cb) => {
	runSequence(['scripts', 'styles', 'partials'], cb);
});

gulp.task('build.component.minified', ['compile:component'], () => {
	const jsFilter = $.filter('**/*.js', { restore: true });
	const cssFilter = $.filter('**/*.css', { restore: true });

	return gulp.src([
		path.join(conf.paths.tmp, 'serve/app/index.css'),
		path.join(conf.paths.tmp, 'serve/app/index.module.js'),
		path.join(conf.paths.tmp, 'partials/templateCacheHtml.js'),
	])
		.pipe(jsFilter)
		.pipe(concat({ path: 'angularjs-dropdown-multiselect.min.js' }))
		.pipe($.sourcemaps.init())
		.pipe($.uglify({ preserveComments: $.uglifySaveLicense })).on('error', conf.errorHandler('Uglify'))
		.pipe($.sourcemaps.write('maps'))
		.pipe(jsFilter.restore)
		.pipe(cssFilter)
		.pipe($.cssnano())
		.pipe(cssFilter.restore)
		.pipe(gulp.dest(path.join(conf.paths.dist, '/')))
		.pipe($.size({ title: path.join(conf.paths.dist, '/'), showFiles: true }));
});

gulp.task('build.component', ['compile:component'], () => {
	const jsFilter = $.filter('**/*.js', { restore: true });
	const cssFilter = $.filter('**/*.css', { restore: true });

	return gulp.src([
		path.join(conf.paths.tmp, 'serve/app/index.css'),
		path.join(conf.paths.tmp, 'serve/app/index.module.js'),
		path.join(conf.paths.tmp, 'partials/templateCacheHtml.js'),
	])
		.pipe(jsFilter)
		.pipe(concat({ path: 'angularjs-dropdown-multiselect.js' }))
		.pipe(jsFilter.restore)
		.pipe(cssFilter)
		.pipe($.cssnano())
		.pipe(cssFilter.restore)
		.pipe(gulp.dest(path.join(conf.paths.dist, '/src')))
		.pipe($.size({ title: path.join(conf.paths.dist, '/'), showFiles: true }));
});

gulp.task('build:component', ['build.component.minified', 'build.component']);
