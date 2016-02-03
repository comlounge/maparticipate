module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        coffee: {
            compile: {
                files: {
                    'static/js/scripts.js': 'coffee/*.coffee'
                }
            }
        },

        watch: {
            css: {
                files: ['less/*.less', 'static/js/*.js'],
                tasks: ['less', 'uglify:core'],
                options: {
                    spawn: false,
                },

            },
            scripts: {
                files: ['coffee/*.coffee'],
                tasks: ['js'],
                options: {
                    spawn: false,
                },
                
            },

        },

        less: {
            development: {
                options: {
                    paths: ['less', 'tmp/bootstrap/less']
                },
                files: {
                    "static/css/bootstrap.css": "less/main.less",
                }
            }
        },

        mkdir: {
            tmp: {
                options: {
                    create: ["tmp"]
                }
            }
        },

        gitclone: {
            bootstrap: {
                options: {
                    repository: "https://github.com/twbs/bootstrap.git",
                    directory: 'tmp/bootstrap'
                }
            }
        },

        bower_concat: {
            all: {
                dest: 'static/js/bower.js',
                cssDest: 'static/css/bower.css',
                exclude: [
                    'modernizr'
                ],
                include: [
                    "jquery",
                    "parsleyjs",
                    "parsleyjs-bootstrap3",
                    "js-cookie"
                ],
                dependencies: {
                },
                bowerOptions: {
                    relative: false
                }
            }
        },


        concat: {
            options: {
                stripBanners: false
            },
            bootstrap: {
                src: [
                    'tmp/bootstrap/js/transition.js',
                    'tmp/bootstrap/js/alert.js',
                    'tmp/bootstrap/js/button.js',
                    'tmp/bootstrap/js/carousel.js',
                    'tmp/bootstrap/js/collapse.js',
                    'tmp/bootstrap/js/dropdown.js',
                    'tmp/bootstrap/js/modal.js',
                    'tmp/bootstrap/js/tooltip.js',
                    'tmp/bootstrap/js/popover.js',
                    'tmp/bootstrap/js/scrollspy.js',
                    'tmp/bootstrap/js/tab.js',
                    'tmp/bootstrap/js/affix.js'
                ],
                dest: 'static/js/bt.js'
            }
        },
        uglify: {
            options: {
                preserveComments: 'some',
                sourceMap: true
            },
            core: {
                src: '<%= concat.bootstrap.dest %>',
                dest: 'static/js/bt.min.js'
            },
            bower: {
                src: '<%= bower_concat.all.dest %>',
                dest: 'static/js/bower.min.js'
            }

        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-coffee');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-git');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-bower-concat');

    // Default task(s).
    //grunt.registerTask('default', ['coffee', 'less']);
    grunt.registerTask('default', ['less', 'coffee', 'uglify']);
    grunt.registerTask('js', ['coffee', 'bower_concat', 'concat', 'uglify']);
    grunt.registerTask('css', ['less', 'uglify']);
    grunt.registerTask('init', ['mkdir', 'gitclone']);

};

