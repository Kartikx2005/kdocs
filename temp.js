import { createInterface } from 'readline';
import chalk from 'chalk';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const themeColor = 'blue'; // Example theme color

function runInteractiveCLI() {
  rl.question(chalk[themeColor]('Enter a command: '), (command) => {
    console.log(`Received command: ${command}`); // Debugging statement

    switch (command.trim()) {
      case 'exit':
        console.log(chalk[themeColor]('Exiting the CLI...'));
        rl.close(); // Close the readline interface
        break;
      case 'create':
        console.log(chalk[themeColor]('Create command executed.'));
        // Add your create command logic here
        runInteractiveCLI(); // Prompt for the next command
        break;
      // Add more cases for other commands
      default:
        console.log(chalk.red('Unknown command. Please try again.'));
        runInteractiveCLI(); // Prompt for the next command
        break;
    }
  });
}

// Start the interactive CLI
runInteractiveCLI();