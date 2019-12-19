module.exports = function(grunt) {
  const DEBOUNCE_DELAY_TIME = 50;
  const WATCH_OPTIONS = {
    debounceDelay: DEBOUNCE_DELAY_TIME
  };
  const CSS_MIN_MIN_FILES_OPTIONS = {
    expand: true,
    cwd: 'src/css',
    src: '*.css',
    dest: 'dist/css',
    ext: '.min.css'
  };
  const UGLIFY_FILES_OPTIONS = {
    'dist/js/xml-viewer.min.js': ['src/js/xml-viewer.js']
  };
  const WATCH_CSS_FILES_OPTIONS = 'src/css/*.css';
  const WATCH_JS_FILES_OPTIONS = 'src/js/*.js';
  const BROWSER_SYNC_FILES_OPTIONS = [
    'src/css/*.css',
    'src/js/*.js',
    'dist/css/*.css',
    'dist/js/*.js',
    '*.html'
  ];

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    cssmin: {
      target: {
        files: [CSS_MIN_MIN_FILES_OPTIONS]
      }
    },
    uglify: {
      main: {
        files: UGLIFY_FILES_OPTIONS
      }
    },
    watch: {
      cssfiles: {
        files: WATCH_CSS_FILES_OPTIONS,
        tasks: ['cssmin'],
        options: WATCH_OPTIONS
      },
      jsfiles: {
        files: WATCH_JS_FILES_OPTIONS,
        tasks: ['uglify'],
        options: WATCH_OPTIONS
      }
    },
    browserSync: {
      bsFiles: {
        src: BROWSER_SYNC_FILES_OPTIONS
      },
      options: {
        watchTask: true,
        server: './'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify-es');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-browser-sync');

  grunt.registerTask('serve', ['browserSync', 'watch']);
  grunt.registerTask('build', ['cssmin', 'uglify']);
};
