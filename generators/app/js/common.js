'use strict';
const chalk = require('chalk');
const shell = require('shelljs');
const spinner = require('ora');
const fuzzy = require('fuzzy');

const CANCEL_OPTION =  {
    name : chalk.inverse('Cancel'),
    value : 'cancel'
};
const SEPERATOR =  {
    type: 'separator', 
    line: '--------------'
};

// enum for NONE
const DEFAULT_NONE = Object.freeze(
             {  name:'NONE',
                value:'NONE',
                alias: 'NONE'
            });

const INFO = function(msg){ return chalk.blueBright(msg); }
const SUCCESS = function(msg){ return chalk.greenBright(msg); }
const WARNING = function(msg){ return chalk.yellowBright(msg); }
const ERROR = function(msg){ return chalk.redBright(msg); }

module.exports = {

    /**********
     * Get all SFDX commands from `sfdx commands`
     * Parse and Return output as JSON object with all SFDX commands
     * *********/
    initSFDXCommands: function() {
        let output = {
            sfdxCommand:'sfdx commands --json',
            code:'',
            result:''
        };
        // starts loading
        this.loading = new spinner(
            { spinner:'dots',
              color : 'blue' }
          ).start(WARNING('start pulling sfdx commands...\n'));

        shell.echo( INFO('run : ' + output.sfdxCommand));
        let commandOutput = shell.exec(output.sfdxCommand, { silent: true } );
            // output code
            output.code = commandOutput.code;
        if(commandOutput.code === 0){
            // command output
            let sfdxCommandsOutput = JSON.parse( commandOutput.stdout );
            output.result = sfdxCommandsOutput;
            this.loading.succeed( SUCCESS('all commands were pulled successfully'));  
        }
        else {
            // command error output
            output.result = JSON.parse( commandOutput.stderr );
            this.loading.fail( ERROR('failed pulling commands')); 
        }
       return output;
    },
     /**********
     * Get all SFDX orgs from `sfdx force:org:list`
     * Parse and Return output as JSON object with all orgs
     * *********/
    getOrgs: function() {
        let output = {
            sfdxCommand:'sfdx force:org:list --json',
            code:'',
            nonScratchOrgs:[],
            scratchOrgs:[],
            defaultDevHub: DEFAULT_NONE,
            defaultScratchOrg: DEFAULT_NONE
        };
        this.loading = new spinner(
            { spinner:'monkey',
              color : 'yellow' }
          ).start(WARNING('loading org defaults...\n'));

        // Silently get the available orgs as JSON
        let orgsCommand = shell.exec( output.sfdxCommand, { silent: true } );
            // output code
            output.code = orgsCommand.code;
            if(orgsCommand.code === 0){
                    let orgsOutput = JSON.parse( orgsCommand.stdout );
                    // Collect all non Scratch orgs
                    output.nonScratchOrgs = orgsOutput.result.nonScratchOrgs.map(org => ({
                                                                                            name : `${ERROR(org.alias)} (${INFO('O')}) - ${org.username}`,
                                                                                            value: org.username,
                                                                                            alias: org.alias,
                                                                                            orgType: 'org',
                                                                                            details: org
                                                                                        }));
                    // Grab Default DevHub
                    if(output.nonScratchOrgs.length > 0) {
                            output.defaultDevHub = output.nonScratchOrgs.find(org => org.details.isDefaultDevHubUsername);
                            if(!output.defaultDevHub) 
                                output.defaultDevHub =  DEFAULT_NONE;
                    }
                    else {
                        output.defaultDevHub = DEFAULT_NONE;
                    }
                
                    // Collect Scratch Orgs
                    output.scratchOrgs  = orgsOutput.result.scratchOrgs.map(org => ({
                                                                                        name : `${ERROR(org.alias)} (${INFO('S')}) - ${org.username}`,
                                                                                        value: org.username,
                                                                                        alias: org.alias,
                                                                                        orgType: 'scratch',
                                                                                        details: org
                                                                                    }));
                    // Grab Default Scratch Org
                    if(output.scratchOrgs.length > 0) {
                        output.defaultScratchOrg = output.scratchOrgs.find(org => org.details.isDefaultUsername);
                        if(!output.defaultScratchOrg) {
                            output.defaultScratchOrg = DEFAULT_NONE;
                        }
                    }
                    else {
                        output.defaultScratchOrg = DEFAULT_NONE;
                    }
                // Stops Spinner and show success
                this.loading.succeed('Pulled defaults successfully');   
                
                if(output.defaultDevHub !== DEFAULT_NONE) {
                    output.yosay = chalk.redBright.underline('Welcome to DX \n') + 
                    `Connected Orgs : ${chalk.cyan(output.nonScratchOrgs.length)} \n` +
                    `Active Scratch Orgs : ${chalk.cyan(output.scratchOrgs.length)} \n\n` + 
                    `Default DevHub : ${chalk.cyan( output.defaultDevHub.alias )} \n` +
                    `Default Scratch : ${chalk.cyan( output.defaultScratchOrg.alias )} ` ;
                }
                else {
                    output.yosay = chalk.redBright('NEED TO CONNECT DEVHUB');
                }
            }
            else {
                // Stops Spinner and show failure
                this.loading.fail('Failed to pull defaults');
                shell.exit(1);
            }
        return output;
    },
    /**********
     * Get schema sobjects list from `sfdx force:schema:sobject:list`
     * Parse and Return output as JSON object with all sobjects to select
     * *********/
    getSchema: function(username) {
        let schemaCommand = 'sfdx force:schema:sobject:list --json -c all';
        let output;
        if(username)
        schemaCommand += ' -u ' + username;
        // starts loading
        this.loading = new spinner(
            { spinner:'dots',
              color : 'blue' }
          ).start(WARNING('getting schema...\n'));

        shell.echo( INFO('run : ') + WARNING(schemaCommand));
        let commandOutput = shell.exec(schemaCommand, { silent: true } );
        if(commandOutput.code === 0){
            // command output
            let sfdxCommandsOutput = JSON.parse( commandOutput.stdout );
            output = sfdxCommandsOutput.result.map(sobject => ({ name : sobject, value : sobject }));
            this.loading.succeed( SUCCESS('all sobject were pulled successfully'));  
           
        }
        else {
            // command error output
            output = JSON.parse( commandOutput.stderr );
            this.loading.fail( ERROR('failed pulling commands')); 
        }
       return output;
    },
    /**********
     * Get schema sobjects fields list from `sfdx force:schema:sobject:describe`
     * Parse and Return output as JSON object with all sobjects fields to select
     * *********/
    getSObjectDescribe:function(sobjecttype,targetusername,usetoolingapi = false) {
        this.loading = new spinner(
            { spinner:'monkey',
              color : 'yellow' }
          ).start('getting describe object : ' + sobjecttype + ' from ' + targetusername +'\n');

        let schemaCommand = 'sfdx force:schema:sobject:describe';
            schemaCommand += ' --json';
            schemaCommand += ' -u ' + targetusername;
            schemaCommand += ' -s ' + sobjecttype;
        
        if(usetoolingapi)
            schemaCommand += ' -t ';
        
        let output = {};
        let commandOutput = shell.exec( schemaCommand , { silent: true } );
        if(commandOutput.code === 0){
         const response = JSON.parse( commandOutput.stdout );
                output = response.result;
                if(output) {
                    output.value = output.name;
                    output.fields = output.fields.map( field => ({ 
                        name: `${ERROR(field.name)} - ${field.label}`,
                        value: field.name,
                        checked: field.nameField ? true : false,
                        updateable: field.updateable,
                        createable: field.createable,
                        externalId: field.externalId,
                        details: field,
                    }) );
                    }
                    this.loading.succeed('Pulled fields successfully from ' + output.name );   
                }
                else {
                    this.loading.fail('Failed to pull fields from ' + sobjecttype); 
                }  
        return output;
    },
     /**********
     * Execute SFDX command
     * *********/
    runSFDXCommand: function(command) {
        let output = {
            command: command,
            code:'1',
            result:''
        };
        // starts loading
        this.loading = new spinner(
            { spinner:'dots2',
              color : 'yellow' }
          ).start(WARNING('getting sfdx commands...\n'));

        shell.echo(INFO('run : ' + output.command));
        let commandOutput = shell.exec(command, { silent: true } );
            // output code
            output.code = commandOutput.code;
        if(commandOutput.code === 0){
            // command output
            try {
                output.result = JSON.parse( commandOutput.stdout );
            }
            catch (ev) {
                output.result = commandOutput.stdout;
            }
            this.loading.succeed( SUCCESS('command ran successfully'));  
        }
        else {
            // command error output
            this.log(commandOutput.stdout);
            this.loading.fail( ERROR('command failed to execute')); 
            shell.exit(1);
        }
       return output;
    },
    /*******
     * build command describe output with relevenat flags
     *******/
    getCommandDescribe: function( commandObject , defaultCommandOptions){

    let output = {
        name: commandObject.value,
        details: commandObject.output,
        relatedFlags : [],
        defaultFlags : []
    };
    // get flags from command output
    const commandFlags = commandObject.output.flags;
    if(commandFlags){
        for(const flag in commandFlags) {
            if(commandFlags.hasOwnProperty(flag)) {
            // undefined check and populate with 'name'
            if(!commandFlags[flag]['char'])
            commandFlags[flag]['char'] = '-'+commandFlags[flag]['name'];

                // build options for command flags
                const optionItem = {
                    name: ERROR('-'+commandFlags[flag]['char']) +' '+ commandFlags[flag]['description'],
                    value: '-'+commandFlags[flag]['char'],
                    type: commandFlags[flag]['type'],
                    description:commandFlags[flag]['description'],
                    required:commandFlags[flag]['required'],
                    disabled:commandFlags[flag]['required'],
                    short: commandFlags[flag]['name'],
                    default: commandFlags[flag]['default'],
                    options: commandFlags[flag]['options']
                }
                // all command related flags
                output.relatedFlags.push(optionItem);
        }
      }
      // filter all default values passed
      output.defaultFlags = output.relatedFlags.filter(flag => ( flag.required || 
                                                                 flag.default == true || 
                                                                 defaultCommandOptions.includes(flag.value) || 
                                                                 defaultCommandOptions.includes(flag.short) )).map(item => item.value );
    }
    return output;
    },
     /*******
     * used in auto-complete questions to search by keyword
     *******/
    searchByKey: function(input, searchOptions, key = 'name') {
        input = input || '';
        return new Promise(function(resolve) {
            var fuzzyResult = fuzzy.filter(input, searchOptions, {
              extract: function(item) {
                return item[key];
              }
            });
            resolve( 
                fuzzyResult.map(function(element) {
                return element.original;
            }) );
        });
    },
    /*******
     * build dynamic questions from flags
     *******/
    createQuestions: function(selectedFlags, schemaOutput) {
        let questions = [];
        const self = this;

        selectedFlags.forEach(flag => { 
         
            const isOptions = flag.type == 'option' ? true : false;
            const isFile = flag.value == '-f'  ? true : false;
            const isFolder = flag.value == '-d'  ? true : false;
            const isSObject = flag.short == 'sobjecttype' ? true : false;
            const isValues = flag.value == '-v' ? true : false;

            let question = {};
           
            if( isOptions ){
                
                // when have options display as choices
                if( flag.options ) {
                    const flagOptionsValues = flag.options.map(opt => ({ name : opt, value : opt }));
                    question = {
                        type: 'list',
                        name: flag.value,
                        message: flag.description,
                        default: flag.default,
                        choices: flagOptionsValues
                    } 
                }
                else if ( isFolder ) {
                    question = {
                        type: 'directory',
                        name: flag.value,
                        message: flag.description,
                        basePath: process.cwd()
                    }
                }
                else if ( isFile ) {
                    question = {
                        type: 'filePath',
                        name: flag.value,
                        message: flag.description,
                        basePath: process.cwd()
                    }
                }
                else if( isSObject ){
                         question = {
                             type: 'autocomplete',
                             name: flag.value,
                             message:flag.description,
                             default:'Account',
                             pageSize: 5,
                             suggestOnly: false,
                             source : function(answers, input){
                                 return self.searchByKey(input, schemaOutput, 'value');
                             }
                         }
                   }
                // standard input
                else {
                        question = {
                        type: 'input',
                        name: flag.value,
                        message:flag.description,
                        default:flag.default,
                        validate: function(value){
                                    return value ? true : 'Must enter a value';
                                    }
                        }}
                
            }
            else if(flag.type == 'boolean'){
                    question = {
                        type: 'confirm',
                        name: flag.value,
                        message:flag.description
                    }
            }
            if(!isValues)
            questions.push(question);
          });
          return questions;
    },
 

    open: function(path) {
        shell.exec(' open '+ path);
    },
    openCode: function(path) {
        shell.exec(' code '+ path);
    },
    sayText: function(textString) {
        shell.exec(' say \''+ textString + '\'');
    }
  }

