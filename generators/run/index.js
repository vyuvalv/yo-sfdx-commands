const Generator = require('yeoman-generator');
const chalk = require('chalk');
const shell = require('shelljs');

const INFO = function(msg){ return chalk.blueBright(msg); }
const BOLD = function(msg){ return chalk.bold(msg); }
const ERROR = function(msg){ return chalk.redBright(msg); }

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
        this.argument("output", { type: Object, required: false });
      }
      initializing() {
        this.env.adapter.promptModule.registerPrompt('filePath', require('inquirer-file-path'));
      }
      prompting() { 
          const fileQuestion = [
            {
                type: 'filePath',
                name: 'commandOutputFile', 
                message: ERROR('commands output file name'),
                default: 'commands.json',
                basePath: process.cwd()
            },
            {
              type: 'input',
              name: 'commandOutputFile2',  
              message: ERROR('commands output file name'),
              default: 'commands.json',
              filter:function(fileName) {
                //always store as .json
                fileName = fileName.indexOf('.') >= 1 ? fileName.replace(fileName.substr(fileName.indexOf('.'),fileName.length), '.json') :fileName + '.json';
                return fileName;
              },
              validate: function(value){
                return value ? true : 'give the command a name';
              }
            },
              
          ];
          return this.prompt(fileQuestion).then((answers) => {

                this.fileName = answers.commandOutputFile;

                let commandsPath = this.destinationPath() + '/'+this.fileName;

                    let commandsArray = [];
                    if(this.fs.exists(commandsPath)) {
                      commandsArray = this.fs.readJSON(commandsPath);
                    }
                    this.sfdxCommands = commandsArray.map(comm => comm);

                    if( this.sfdxCommands.length ){
                      const mainQuestions = [{
                        type: 'checkbox',
                        name: 'allcommands',  
                        message: 'select commands',
                        choices: this.sfdxCommands
                      }];
                      return this.prompt(mainQuestions).then((answers) => {

                          this.props = answers.allcommands;
                      });
                    }



               
            });
      }
      writing() {
         
          if(this.props){
            let commandString = this.props.join(' && ');
            shell.echo(commandString);
            //shell.exec(commandString);
          }
          
      }

     end() {
  
    }



};