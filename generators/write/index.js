const Generator = require('yeoman-generator');
const chalk = require('chalk');
const shell = require('shelljs');

const INFO = function(msg){ return chalk.blueBright(msg); }
const BOLD = function(msg){ return chalk.bold(msg); }

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
        this.argument("output", { type: Object, required: false });
      }
      initializing() {
        this.props ={ };
        this.props.cmdOutput = this.options.output.result;
        if(this.options.output.result)
        this.log( `\n ${INFO("Output :")} \n\n  ${BOLD(JSON.stringify( this.props.cmdOutput,null,2 ))} `);
      }
      prompting() { 
          const questions = [
              {
                type: 'confirm',
                name: 'doWrite',  
                message: 'would you like to store this output',
                default: false
              },
              {
                type: 'input',
                name: 'outputFileName',
                message: 'name of the output file',
                when: function(answers) {
                    return answers.doWrite;
                },
                default: 'log.json'
              }

          ];
          return this.prompt(questions).then((answers) => {
                this.props.isSave = answers.doWrite;
                this.props.outputFileName = answers.outputFileName;
            });
      }
      writing() {
          if(this.props.isSave) { 
            this.log('filename: ' + this.props.outputFileName);
            this.fs.writeJSON( this.props.outputFileName, this.props.cmdOutput);
          }
      }

     end() {
  
    }



};