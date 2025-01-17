import inquirer from 'inquirer';
import chalk from 'chalk';

const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

export async function selectThemeColor() {
  const { color } = await inquirer.prompt([
    {
      type: 'list',
      name: 'color',
      message: 'Choose a theme color for the terminal:',
      choices: colors,
    },
  ]);

  console.log(chalk[color](`You selected the ${color} theme!`));
}
