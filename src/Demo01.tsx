/**
 * 基于正则文法和有限自动机
 * 实现简单的词法分析器
 * 能识别 Identifier、IntLiteral、保留关键字int和简单操作符
 */

/**
 * token类型
 */
enum TokenType {
  Identifier,
  IntLiteral, // number
  GT, // >
  GE, // >=
  Int, // [保留字]int
  Assignment, // =
  Plus, // +
  Minus, // -
  Star, // *
  Slash, // /
  SemiColon, // ;
  LeftParen, // (
  RightParen, // )
}

/**
 * 有限状态机的各种状态
 * 通过状态迁移最终确定token状态
 */
enum DfaState {
  Initial, // 初始状态

  // If,
  // Id_if1,
  // Id_if2,
  // Else,
  // Id_else1,
  // Id_else2,
  // Id_else3,
  // Id_else4,

  // [保留字] int
  Int,
  Id_int1, // i
  Id_int2, // in
  Id_int3, // int, 不直接切换Int是为了消除下个字符的影响，如inta

  Id, // Identifier
  GT, // >
  GE, // >=
  Assignment, // =
  Plus, // +
  Minus, // -
  Star, // *
  Slash, // /
  SemiColon, // ;
  LeftParen, // (
  RightParen, // )
  IntLiteral, // number
}

/**
 * Token接口
 */
interface Token {
  getType(): TokenType;
  getText(): string;
}

/**
 * Token读取器接口
 */
interface TokenReader {
  read(): Token | null;
  peek(): Token | null;
  unread(): void;
  getPosition(): number;
  setPosition(position: number): void;
}

/**
 * @class SimpleToken
 * 简单的Token实现(包含 type 和 text)
 */
class SimpleToken implements Token {
  private type: TokenType = TokenType.Identifier;
  private text: string = '';

  getType(): TokenType {
    return this.type;
  }

  getText(): string {
    return this.text;
  }

  setType(type: TokenType): void {
    this.type = type;
  }

  setText(text: string): void {
    this.text = text;
  }
}

/**
 * @class SimpleTokenReader
 * 简单的Token流实现，用于tokens的读取
 */
class SimpleTokenReader implements TokenReader {
  private tokens: Token[] = [];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  read(): Token | null {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos++];
    }
    return null;
  }

  peek(): Token | null {
    if (this.pos < this.tokens.length) {
      return this.tokens[this.pos];
    }
    return null;
  }

  unread(): void {
    if (this.pos > 0) {
      this.pos--;
    }
  }

  getPosition(): number {
    return this.pos;
  }

  setPosition(position: number): void {
    if (position >= 0 && position < this.tokens.length) {
      this.pos = position;
    }
  }
}

/**
 * @class SimpleLexer
 * 核心词法分析器
 */
class SimpleLexer {
  private tokenText: string = ''; // 临时保存token的文本
  private tokens: Token[] = []; // 保存解析出来的Token
  private token: SimpleToken = new SimpleToken(); // 当前正在解析的Token

  // 是否是字母
  private isAlpha(ch: string): boolean {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
  }

  // 是否是数字
  private isDigit(ch: string): boolean {
    return ch >= '0' && ch <= '9';
  }

  // 是否是空白字符
  private isBlank(ch: string): boolean {
    return ch === ' ' || ch === '\t' || ch === '\n';
  }

  /**
   * 有限状态机针对token初始状态的处理
   * @param {string} ch 当前字符
   * @returns {DfaState} 新的状态
   */
  private initToken(ch: string): DfaState {
    // 对上一次的token收尾处理
    if (this.tokenText.length > 0) {
      // token入库
      this.token.setText(this.tokenText);
      this.tokens.push(this.token);
      // 创建新token
      this.tokenText = '';
      this.token = new SimpleToken();
    }

    // 恢复初始状态
    let newState = DfaState.Initial;
    if (this.isAlpha(ch)) {
      // 保留关键字处理
      // 第一个字符是字母(对保留关键字int的特殊处理)
      if (ch === 'i') {
        newState = DfaState.Id_int1; // 进入一个特殊的中间状态，Id_int1=>Id_int2=>INT
      } else {
        newState = DfaState.Id; // 进入Id状态
      }
      // 先设置为 Identifier，若为保留字再改为 Int
      this.token.setType(TokenType.Identifier);
      this.tokenText += ch;
    } else if (this.isDigit(ch)) {
      // 第一个字符是数字
      newState = DfaState.IntLiteral;
      this.token.setType(TokenType.IntLiteral);
      this.tokenText += ch;
    } else if (ch === '>') {
      // 第一个字符是>
      newState = DfaState.GT;
      this.token.setType(TokenType.GT);
      this.tokenText += ch;
    } else if (ch === '+') {
      newState = DfaState.Plus;
      this.token.setType(TokenType.Plus);
      this.tokenText += ch;
    } else if (ch === '-') {
      newState = DfaState.Minus;
      this.token.setType(TokenType.Minus);
      this.tokenText += ch;
    } else if (ch === '*') {
      newState = DfaState.Star;
      this.token.setType(TokenType.Star);
      this.tokenText += ch;
    } else if (ch === '/') {
      newState = DfaState.Slash;
      this.token.setType(TokenType.Slash);
      this.tokenText += ch;
    } else if (ch === ';') {
      newState = DfaState.SemiColon;
      this.token.setType(TokenType.SemiColon);
      this.tokenText += ch;
    } else if (ch === '(') {
      newState = DfaState.LeftParen;
      this.token.setType(TokenType.LeftParen);
      this.tokenText += ch;
    } else if (ch === ')') {
      newState = DfaState.RightParen;
      this.token.setType(TokenType.RightParen);
      this.tokenText += ch;
    } else if (ch === '=') {
      newState = DfaState.Assignment;
      this.token.setType(TokenType.Assignment);
      this.tokenText += ch;
    } else {
      newState = DfaState.Initial; // skip all unknown patterns
    }
    return newState;
  }

  /**
   * 解析字符串，形成Token，处理有限自动机状态迁移
   * @param {string} code 要解析的代码
   * @returns {SimpleTokenReader} Token读取器
   */
  public tokenize(code: string): SimpleTokenReader {
    this.tokens = []; // 保存解析出来的Token
    this.tokenText = ''; // 临时保存token的文本
    this.token = new SimpleToken(); // 当前正在解析的Token

    // 初始状态为 Initial
    let state = DfaState.Initial;

    // 逐字符解析
    for (let i = 0; i < code.length; i++) {
      const ch = code.charAt(i);

      switch (state) {
        case DfaState.Initial:
          state = this.initToken(ch); // 结束前置状态并重新确定后续状态
          break;
        case DfaState.Id:
          if (this.isAlpha(ch) || this.isDigit(ch)) {
            this.tokenText += ch; // 保持标识符状态
          } else {
            state = this.initToken(ch); // 退出标识符状态，并保存Token
          }
          break;
        case DfaState.GT: // >
          if (ch === '=') {
            this.token.setType(TokenType.GE); // > => >= 转换成GE
            state = DfaState.GE;
            this.tokenText += ch;
          } else {
            state = this.initToken(ch); // 退出GT状态，并保存Token
          }
          break;
        case DfaState.GE: // >=
        case DfaState.Assignment: // =
        case DfaState.Plus: // +
        case DfaState.Minus: // -
        case DfaState.Star: // *
        case DfaState.Slash: // /
        case DfaState.SemiColon: // ;
        case DfaState.LeftParen: // (
        case DfaState.RightParen: // )
          state = this.initToken(ch); // 退出当前状态，并保存Token
          break;
        case DfaState.IntLiteral: // number
          if (this.isDigit(ch)) {
            this.tokenText += ch; // 继续保持在数字字面量状态
          } else {
            state = this.initToken(ch); // 退出当前状态，并保存Token
          }
          break;
        case DfaState.Id_int1: // i
          if (ch === 'n') {
            state = DfaState.Id_int2; // in
            this.tokenText += ch;
          } else if (this.isDigit(ch) || this.isAlpha(ch)) {
            state = DfaState.Id; // 切换回Id状态(不用切token状态，因为已经是Identifier)
            this.tokenText += ch;
          } else {
            state = this.initToken(ch);
          }
          break;
        case DfaState.Id_int2: // in
          if (ch === 't') {
            state = DfaState.Id_int3; // int，不直接切换为 Int 是为了消除后面字符的影响，如 inta
            this.tokenText += ch;
          } else if (this.isDigit(ch) || this.isAlpha(ch)) {
            state = DfaState.Id; // 切换回id状态
            this.tokenText += ch;
          } else {
            state = this.initToken(ch);
          }
          break;
        case DfaState.Id_int3: // int
          if (this.isBlank(ch)) {
            this.token.setType(TokenType.Int); // int
            state = this.initToken(ch);
          } else {
            state = DfaState.Id; // 切换回Id状态
            this.tokenText += ch;
          }
          break;
        default:
          break;
      }
    }

    // 处理完最后一个token后切换initToken，在initToken中收尾处理
    if (this.tokenText.length > 0) {
      this.initToken(code.charAt(code.length - 1));
    }

    return new SimpleTokenReader(this.tokens);
  }

  /**
   * 遍历打印所有的Token
   * @param {SimpleTokenReader} tokenReader Token读取器
   */
  public static dump(tokenReader: SimpleTokenReader): void {
    console.log('[text]\t\t[type]');
    let token: Token | null;
    while ((token = tokenReader.read()) !== null) {
      const text = token.getText();
      const seperator = '\t'.repeat(Math.max(1, 3 - Math.floor(text.length / 4)));
      console.log(`${text}${seperator}${TokenType[token.getType()]}`);
    }
  }
}

// 测试代码
function testLexer() {
  const lexer = new SimpleLexer();

  let script = 'int age = 30';
  console.log(`\nparse: ${script}`);
  let tokenReader = lexer.tokenize(script);
  SimpleLexer.dump(tokenReader);

  // 测试inta的解析
  script = 'inta age = 30;';
  console.log(`\nparse: ${script}`);
  tokenReader = lexer.tokenize(script);
  SimpleLexer.dump(tokenReader);

  // 测试in的解析
  script = 'in age = 30;';
  console.log(`\nparse: ${script}`);
  tokenReader = lexer.tokenize(script);
  SimpleLexer.dump(tokenReader);

  // 测试>=的解析
  script = 'age >= 30;';
  console.log(`\nparse: ${script}`);
  tokenReader = lexer.tokenize(script);
  SimpleLexer.dump(tokenReader);

  // 测试>的解析
  script = 'age > 30;';
  console.log(`\nparse: ${script}`);
  tokenReader = lexer.tokenize(script);
  SimpleLexer.dump(tokenReader);
}

// 执行测试
testLexer();
