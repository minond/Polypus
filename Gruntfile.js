module.exports = function(grunt) {
    grunt.initConfig({
        jasmine: {
            coverage: {
                src: ["src/*.js"],
                options: {
                    specs: ["tests/*.js"],
                    template: require("grunt-template-jasmine-istanbul"),
                    templateOptions: {
                        coverage: "bin/coverage/coverage.json",
                        report: "bin/coverage"
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks("grunt-contrib-jasmine");
};
