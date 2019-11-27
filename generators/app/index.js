const Generator = require('yeoman-generator');
const shell = require('shelljs');
const chalk = require('chalk');
const spinner = require('ora');
const helper = require('../app/js/common.js');

var fuzzy = require('fuzzy');


module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.argument("skipIntro", { type: Boolean, required: false });

  }

initializing() {
  // register auto complete questions types
  this.env.adapter.promptModule.registerPrompt("autocomplete", require("inquirer-autocomplete-prompt"));
  this.env.adapter.promptModule.registerPrompt("checkbox-plus", require("inquirer-checkbox-plus-prompt"));

  // getting all SFDX commands
  let sfdxCommandsOutput = helper.getSFDXCommands();
  // mapping the commands into question options
  if(sfdxCommandsOutput.code === 0){
    this.sfdxCommands = sfdxCommandsOutput.result.map( command =>({ name :command.id, 
                                                                    value: command.id , 
                                                                    output: command }));
  }
  else {
    this.log(`ERROR ${ chalk.red(sfdxCommandsOutput.result ) }`);
  }
    
}


prompting() { 

    const sfdx_commands = this.sfdxCommands;  
    // allow to select and autocomplete any SFDX command     
    const commandsQuestion = [
            {
            type: 'autocomplete',
            name: 'command',
            suggestOnly: false,
            message: chalk.yellow('Choose a Command : '),
            source: function(answers, input){
              return helper.searchByKey(input, sfdx_commands,'value');
            },
            pageSize: 5,
            validate: function(val) {
              let found = sfdx_commands.some(item => item.value == val);
              return found ? true : val +' Was not found in commands ';
            },
          },
        ];
    
    // will store the command publicly 
    this.props = {
      command : 'sfdx ',
      flags : [{ value : '--help' }]
    };
      
    // prompt select an SFDX command
    return this.prompt(commandsQuestion).then((answers) => {
        // store selected command
        this.props.command = answers.command;
        // find the selected command object
        const output = helper.getCommandDescribe(answers.command,this.sfdxCommands);
        // show some examples if exists
        if(output.details.examples && output.details.examples.length){
            this.log(chalk.cyan('Examples : \n'));
          output.details.examples.forEach( item => {
            this.log(item);
          });
            this.log(' \n');
       }

        // allow to multi select an options for flags to later on create questions for values
        const commandDetailsQuestion = [ {
          type: 'checkbox-plus',
          name: 'selectedFlags',
          message: chalk.yellow('Select flags'),
          pageSize: 5,
          highlight: true,
          searchable: true,
          default: output.defaultFlags,
          validate: function(answer) {
            if (answer.length == 0) {
              return 'You must choose at least one flag.';
            }
            return true;
          },
          source: function(answersSoFar, input){
            return helper.searchByKey( input, output.relatedFlags);
          }
        }];

        // prompt flags options
        return this.prompt(commandDetailsQuestion).then((answers) => {

          //create questions from flags
          const extraQuestions = helper.createQuestions(answers.selectedFlags,output.relatedFlags);
          
          // prompt questions for each flag option
          return this.prompt(extraQuestions).then((answers) => {
            // building the command
            let commandText = ` sfdx ${this.props.command}`;
            output.relatedFlags.forEach(flag => {
              // when question value match the flag value
              if(answers[flag.value]){
                // will add the value 
                // TODO: check if needed quotes on files
                if( flag.type == 'option' )
                commandText += ` ${flag.value} ${answers[flag.value]} `;
                // will add booleans values when true
                else if( flag.type == 'boolean' &&  answers[flag.value] )
                commandText += ` ${flag.value}`;
              }
            });
            
            this.props.fullCommand = commandText;
           
          });
        
        });
      });
  }

  configuring() {
  }

  writing() {
    this.log(chalk.yellow(` will run : \n  ${this.props.fullCommand}`));
  }

  end() {
  
  }



};
