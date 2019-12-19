module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        cssmin: {
            target: {
                files: [{
                    expand: true,
                    cwd: 'src/css',
                    src: '*.css',
                    dest: 'dist/css',
                    ext: '.min.css'
                }]
            }
        },
        uglify: {
            main: {
                files: {
                    'dist/js/xml-viewer.min.js': ['src/js/xml-viewer.js']
                }
            }
        },
        watch: {
            cssfiles: {
                files: 'src/css/*.css',
                tasks: ['cssmin'],
                options: {
                    debounceDelay: 50
                }
            },
            jsfiles: {
                files: 'src/js/*.js',
                tasks: ['uglify'],
                options: {
                    debounceDelay: 50
                }
            }
        },
        browserSync: {
            bsFiles: {
                src : [
                    'src/css/*.css',
                    'src/js/*.js',
                    'dist/css/*.css',
                    'dist/js/*.js',
                    '*.html'
                ]
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