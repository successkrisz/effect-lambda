# Contributing to Effect Lambda

Thank you for considering contributing to Effect Lambda! Contributions from the community are welcome, excited to see what you can bring to the project.

## How to Contribute

1. **Fork the Repository**: Start by forking the repository to your GitHub account.

2. **Clone Your Fork**: Clone your forked repository to your local machine.

   ```bash
   git clone https://github.com/your-username/effect-lambda.git
   ```

3. **Create a Branch**: Create a new branch for your feature or bug fix.

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Install Dependencies**: Ensure you have all necessary dependencies installed.

   The project is using [projen](https://projen.io/) to manage tooling. To install the dependencies, run:

   ```bash
   pnpm install && npx projen
   ```

5. **Make Changes**: Implement your changes using a functional programming approach. Ensure your code is clean, well-organized, and adheres to the project's coding standards.

6. **Run Tests**: Before submitting your changes, run the test suite to ensure everything is working correctly.

   ```bash
   pnpm test
   ```

7. **Commit Your Changes**: Commit your changes with a clear and descriptive commit message.

   Please follow the [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) message format when committing your changes

   ```bash
   git commit -m "Add feature: description of feature"
   ```

8. **Push Your Branch**: Push your branch to your forked repository.

   ```bash
   git push origin feature/your-feature-name
   ```

9. **Open a Pull Request**: Go to the original repository and open a pull request. Provide a clear description of your changes and any additional context that might be helpful.

## Reporting Issues

If you encounter any issues or have questions, please open an issue on GitHub. Provide as much detail as possible to help us understand and resolve the issue.

## License

By contributing to Effect Lambda, you agree that your contributions will be licensed under the Apache License 2.0.

Thank you for your contributions!
