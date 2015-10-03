var gulp = require('gulp');
var gutil = require('gulp-util');
var webpack = require('gulp-webpack');
var webpackConfig = require('./webpack.config.js');
var uglifyjs = require('gulp-uglify');
var concat = require('gulp-concat');
var through2 = require('through2');
var path = require('path');
var fs = require('fs');
var cwd = process.cwd();

function webpackBundle(watch) {
    webpackConfig.watch = !!watch;

    return gulp.src('./src/main.js')
        .pipe(webpack(webpackConfig))
        .pipe(gulp.dest('./'));
}

gulp.task('webpack', [], function () {
    return webpackBundle(false);
});


gulp.task('watch', function() {
    var bundle = webpackBundle(true);
    return Promise.all([bundle]);
});

function getComboSrc() {
    var htmlContent = fs.readFileSync('./index-dev.html').toString();
    var regExp = /\<script\s+src="([^"]+)"\>\<\/script\>/g;
    var srcPaths = [];
    var script;
    while (!!(script = regExp.exec(htmlContent))) {
        var srcPath = script[1];
        srcPaths.push(srcPath);
    }

    return srcPaths;
}

gulp.task('dist', ['webpack'], function() {
    var srcPaths = getComboSrc();
    console.log(srcPaths);
    return gulp.src(srcPaths)
        .pipe(concat('pafc.js'))
        .pipe(uglifyjs())
        .pipe(gulp.dest('dist/'));
});

gulp.task('default', ['webpack']);