const { Tokenizer } = require("./Tokenizer");
const { DefaultFactory } = require("./Factories");

const { config } = require("./config");
const { constants } = require("./constants");

// TODO: Add other factory methods
const factory = config.AST_MODE === "default" ? DefaultFactory : null;

// Recursive descent parser
class Parser {
  constructor() {
    this._string = "";
    this._tokenizer = new Tokenizer();
  }

  // Parses a string into an AST.
  parse(string) {
    // this._string = string;
    this._tokenizer.init(string);
    this._lookahead = this._tokenizer.getNextToken();
    return this.Program();
  }

  // Main entry
  Program() {
    return factory.Program(this.StatementList());
  }

  StatementList(stopLookahead = null) {
    const list = [this.Statement()];
    while (this._lookahead != null && this._lookahead.type !== stopLookahead) {
      list.push(this.Statement());
    }
    return list;
  }

  // Expression Statement
  Statement() {
    switch (this._lookahead.type) {
      case constants.SEMICOLON:
        return this.EmptyStatement();
      case constants.CURLY_BRACE_OPEN:
        return this.BlockStatement();
      default:
        return this.ExpressionStatement();
    }
  }

  EmptyStatement() {
    this._eat(constants.SEMICOLON);
    return factory.EmptyStatement();
  }

  BlockStatement() {
    this._eat(constants.CURLY_BRACE_OPEN);
    const body =
      this._lookahead.type !== constants.CURLY_BRACE_CLOSE
        ? this.StatementList(constants.CURLY_BRACE_CLOSE)
        : [];
    this._eat(constants.CURLY_BRACE_CLOSE);

    return factory.BlockStatement(body);
  }

  ExpressionStatement() {
    const expression = this.Expression();
    this._eat(constants.SEMICOLON);
    return factory.ExpressionStatement(expression);
  }

  Expression() {
    return this.Literal();
  }

  Literal() {
    switch (this._lookahead.type) {
      case constants.NUMBER:
        return this.NumericLiteral();
      case constants.STRING:
        return this.StringLiteral();
    }
    throw new SyntaxError("Literal: unexpected literal production");
  }

  StringLiteral() {
    const token = this._eat(constants.STRING);
    const value = token.value.slice(1, -1);
    return factory.StringLiteral(value);
  }

  // NumericLiteral
  NumericLiteral() {
    const token = this._eat(constants.NUMBER);
    const value = Number(token.value);
    return factory.NumericLiteral(value);
  }

  _eat(tokenType) {
    const token = this._lookahead;

    if (token === null) {
      throw SyntaxError(`Unexpected end of input, expected: "${tokenType}"`);
    }

    if (token.type !== tokenType) {
      throw SyntaxError(
        `Unexpected token: "${token.type}", expected: "${tokenType}"`
      );
    }

    this._lookahead = this._tokenizer.getNextToken();

    return token;
  }
}

module.exports = {
  Parser,
};
