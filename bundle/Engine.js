var solfege = require('solfegejs');
var marked = require('marked');

/**
 * The markdown engine
 *
 * @see http://paularmstrong.github.io/swig/docs/api/
 */
var Engine = solfege.util.Class.create(function()
{
    // Set the default configuration
    this.configuration = require('../configuration/default.js');

    // Parse the configuration
    this.parseConfiguration();

    // Created a binded version of the render method
    //var bindGenerator = solfege.util.Function.bindGenerator;
    //this.render = bindGenerator(this, this.render);

}, 'solfege.bundle.markdown.Engine');
var proto = Engine.prototype;

/**
 * The configuration
 *
 * @type {Object}
 * @api private
 */
proto.configuration;

/**
 * Override the current configuration
 *
 * @param   {Object}    customConfiguration     The custom configuration
 * @api public
 */
proto.overrideConfiguration = function*(customConfiguration)
{
    this.configuration = solfege.util.Object.merge(this.configuration, customConfiguration);

    // Parse the configuration
    this.parseConfiguration();
};

/**
 * Parse the configuration and initialize properties
 *
 * @api private
 */
proto.parseConfiguration = function()
{
    marked.setOptions({
        renderer: new marked.Renderer(),
        gfm: true,
        tables: true,
        breaks: false,
        pedantic: false,
        sanitize: true,
        smartLists: true,
        smartypants: false
    });
};

/**
 * Render a file
 *
 * @param   {String}    path        The file path
 * @param   {Object}    parameters  The parameters
 * @return  {String}                The result
 */
proto.render = function*(path, parameters)
{
    var self = this;
    var nodePath = require('path');
    var fs = require('fs');
    var output = yield function(done) {

        // Define the file path
        var filePath;
        if (path[0] === '/') {
            filePath = path;
        } else {
            filePath = nodePath.normalize(self.configuration.path + '/' + path);
        }

        // Get the content
        fs.readFile(filePath, function(error, data) {
            // An error occurred
            if (error) {
                // @todo Handle error
                console.error('Unable to render ' + path);
                done(error);
                return;
            }

            // Convert the content to HTML
            var content = data.toString();
            marked(content, function(error, result) {
                // An error occurred
                if (error) {
                    // @todo Handle error
                    console.error('Unable to render ' + path);
                }

                done(error, result);
            });
        });

    };

    return output;
};

/**
 * The server middleware
 *
 * @param   {solfege.bundle.server.Request}     request     The request
 * @param   {solfege.bundle.server.Response}    response    The response
 * @param   {GeneratorFunction}                 next        The next function
 */
proto.middleware = function*(request, response, next)
{
    var self = this;

    // Add the "render" method in the response
    response.render = function*(path)
    {
        var result = yield self.render(path, response.parameters);
        response.body = result;
    };

    yield *next;
};

module.exports = Engine;
