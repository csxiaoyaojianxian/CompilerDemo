/**
 * 一个简单的语法解析器
 * 基于递归下降算法和上下文无关文法, 生成简化的AST, 实现表达式计算
 * 存在结合性问题，仅优化了加法表达式
 */
/*
add -> mul | add + mul 优化为 add -> mul (+ mul)*
mul -> pri | mul * pri
pri -> Id | Num | (add)
 */

import SimpleLexer, { Token, TokenReader, TokenType, testLexer } from '../Demo01_SimpleLexer';

/**
 * AST节点类型枚举
 */
enum ASTNodeType {
  Programm = 'Programm', // 程序入口，根节点
  IntDeclaration = 'IntDeclaration', // 整型变量声明
  ExpressionStmt = 'ExpressionStmt', // 表达式语句，即表达式+分号
  AssignmentStmt = 'AssignmentStmt', // 赋值语句
  Primary = 'Primary', // 基础表达式
  Multiplicative = 'Multiplicative', // 乘法(除法)表达式
  Additive = 'Additive', // 加法(减法)表达式
  Identifier = 'Identifier', // 标识符
  IntLiteral = 'IntLiteral', // 整型字面量
}

/**
 * AST节点
 */
interface ASTNode {
  getParent(): ASTNode | null;
  getChildren(): ASTNode[];
  getType(): ASTNodeType;
  getText(): string;
}

/**
 * 简单的AST节点实现
 */
class SimpleASTNode implements ASTNode {
  private parent: ASTNode | null = null;
  private children: ASTNode[] = [];
  private readonly nodeType: ASTNodeType; // AST节点类型
  private readonly text: string; // 初始化的文本参数，如整型变量声明时的变量名

  constructor(nodeType: ASTNodeType, text: string) {
    this.nodeType = nodeType;
    this.text = text;
  }

  getParent(): ASTNode | null {
    return this.parent;
  }

  getChildren(): ASTNode[] {
    return [...this.children]; // 返回副本
  }

  getType(): ASTNodeType {
    return this.nodeType;
  }

  getText(): string {
    return this.text;
  }

  addChild(child: SimpleASTNode): void {
    this.children.push(child);
    child.parent = this;
  }
}

/**
 * 实现一个计算器，但计算的结合性是有问题的，尝试修复加法表达式结合性问题
 */
class SimpleCalculator {
  /**
   * 执行脚本，并打印输出AST和求值过程
   * @param {string} script 脚本代码
   */
  public evaluate(script: string): void {
    try {
      // 生成ast
      const tree = this.parse(script);
      this.dumpAST(tree, '');
      // ast执行计算结果
      this.evaluateAST(tree, '');
    } catch (e) {
      console.log(e instanceof Error ? e.message : String(e));
    }
  }

  /**
   * 解析脚本，并返回根节点
   * @param {string} code 脚本代码
   * @returns {ASTNode} AST根节点
   * @throws 解析错误时抛出异常
   */
  public parse(code: string): ASTNode {
    // 词法解析
    const lexer = new SimpleLexer();
    const tokens = lexer.tokenize(code);
    // 语法解析
    const rootNode = this.prog(tokens);

    return rootNode;
  }

  /**
   * 对AST节点求值，并打印求值过程
   * @param {ASTNode} node AST节点
   * @param {string} indent 缩进字符串
   * @returns {number} 计算结果
   */
  private evaluateAST(node: ASTNode, indent: string): number {
    let result = 0;
    console.log(indent + 'Calculating: ' + node.getType());

    switch (node.getType()) {
      case ASTNodeType.Programm:
        for (const child of node.getChildren()) {
          result = this.evaluateAST(child, indent + '\t');
        }
        break;
      case ASTNodeType.Additive: {
        const child1 = node.getChildren()[0];
        const value1 = this.evaluateAST(child1, indent + '\t');
        const child2 = node.getChildren()[1];
        const value2 = this.evaluateAST(child2, indent + '\t');
        if (node.getText() === '+') {
          result = value1 + value2;
        } else {
          result = value1 - value2;
        }
        break;
      }
      case ASTNodeType.Multiplicative: {
        const child3 = node.getChildren()[0];
        const value3 = this.evaluateAST(child3, indent + '\t');
        const child4 = node.getChildren()[1];
        const value4 = this.evaluateAST(child4, indent + '\t');
        if (node.getText() === '*') {
          result = value3 * value4;
        } else {
          result = value3 / value4;
        }
        break;
      }
      case ASTNodeType.IntLiteral:
        result = parseInt(node.getText(), 10);
        break;
      default:
      // 其他类型不处理
    }

    console.log(indent + 'Result: ' + result);
    return result;
  }

  /**
   * 语法解析：根节点
   * @param {TokenReader} tokens Token读取器
   * @returns {SimpleASTNode} AST节点
   * @throws 解析错误时抛出异常
   */
  private prog(tokens: TokenReader): SimpleASTNode {
    const node = new SimpleASTNode(ASTNodeType.Programm, 'Calculator');

    const child = this.additive(tokens);

    if (child !== null) {
      node.addChild(child);
    }
    return node;
  }

  /**
   * 整型变量声明语句
   * @param {TokenReader} tokens Token读取器
   * @returns {SimpleASTNode} AST节点
   * @throws 解析错误时抛出异常
   */
  public intDeclare(tokens: TokenReader): SimpleASTNode {
    let node: SimpleASTNode | null = null;
    let token: Token | null = tokens.peek(); // 预读当前token

    // 流程解读：解析变量声明语句时(如 int a = b+1)
    // [1] 匹配int关键字：先判断第一个 token 是否为 int
    if (token?.getType() === TokenType.Int) {
      token = tokens.read(); // 消耗掉int
      // [2] 匹配标识符：若 int 后匹配到变量名称标识符，则创建 AST 节点
      if (tokens.peek()?.getType() === TokenType.Identifier) {
        token = tokens.read(); // 消耗掉标识符
        // 创建 ast 节点，并传入变量名
        node = new SimpleASTNode(ASTNodeType.IntDeclaration, token!.getText());
        // [3] 匹配等号：判断后面是否跟了初始化部分，即等号加一个表达式
        token = tokens.peek();
        if (token !== null && token.getType() === TokenType.Assignment) {
          tokens.read(); // 消耗掉等号
          // [4] 匹配表达式
          const child = this.additive(tokens);
          if (child === null) {
            throw new Error('invalide variable initialization, expecting an expression');
          } else {
            node.addChild(child);
          }
        }
        token = tokens.peek();
        if (token !== null && token.getType() === TokenType.SemiColon) {
          tokens.read();
        } else {
          throw new Error('invalid statement, expecting semicolon');
        }
      } else {
        throw new Error('variable name expected');
      }
    }

    if (node === null) {
      throw new Error('int declaration expected');
    }
    return node;
  }

  /**
   * 语法解析：加法表达式
   * 包含减法，因为减法是特殊的加法
   * @param {TokenReader} tokens Token读取器
   * @returns {SimpleASTNode} AST节点
   * @throws 解析错误时抛出异常
add -> mul | add + mul 出现结合性bug，如 2+3+4 的顺序为 2+(3+4)

Programm Calculator
  Additive +
    IntLiteral 2
    Additive +
      IntLiteral 3
      IntLiteral 4

add -> mul (+ mul)* 修复

Programm Calculator
  Additive +
    Additive +
      IntLiteral 2
      IntLiteral 3
    IntLiteral 4
   */
  private additive(tokens: TokenReader): SimpleASTNode {
    // 错误：add -> mul | add + mul
    // add -> mul (+ mul)*
    /*
    const child1: SimpleASTNode = this.multiplicative(tokens); // left
    let node: SimpleASTNode = child1;
    const token = tokens.peek();
    if (child1 !== null && token !== null) {
      if (token.getType() === TokenType.Plus || token.getType() === TokenType.Minus) {
        const opToken = tokens.read();
        const child2 = this.additive(tokens); // right
        if (child2 !== null) {
          node = new SimpleASTNode(ASTNodeType.Additive, opToken!.getText());
          node.addChild(child1);
          node.addChild(child2);
        } else {
          throw new Error('invalid additive expression, expecting the right part.');
        }
      }
    }
    if (node === null) {
      throw new Error('additive expression expected');
    } */
    let child1: SimpleASTNode = this.multiplicative(tokens); // 应用add规则
    let node: SimpleASTNode = child1;
    if (child1) {
      // 尾递归优化为循环，系统开销更低
      while (true) {
        // 循环应用add'规则
        let token = tokens.peek();
        if (token && (token.getType() === TokenType.Plus || token.getType() === TokenType.Minus)) {
          token = tokens.read(); // 读出加号
          const child2 = this.multiplicative(tokens); // 计算下级节点
          node = new SimpleASTNode(ASTNodeType.Additive, token!.getText());
          node.addChild(child1); //注意，新节点在顶层，保证正确的结合性
          node.addChild(child2);
          child1 = node;
        } else {
          break;
        }
      }
    }
    return node;
  }

  /**
   * 语法解析：乘法表达式
   * 包含除法，因为除法是特殊的乘法
   * @param {TokenReader} tokens Token读取器
   * @returns {SimpleASTNode} AST节点
   * @throws 解析错误时抛出异常
   */
  private multiplicative(tokens: TokenReader): SimpleASTNode {
    // mul -> pri | mul * pri
    const child1: SimpleASTNode = this.primary(tokens);
    let node: SimpleASTNode = child1;
    const token = tokens.peek();
    if (child1 !== null && token !== null) {
      if (token.getType() === TokenType.Star || token.getType() === TokenType.Slash) {
        const opToken = tokens.read();
        const child2 = this.multiplicative(tokens);
        if (child2 !== null) {
          node = new SimpleASTNode(ASTNodeType.Multiplicative, opToken!.getText());
          node.addChild(child1);
          node.addChild(child2);
        } else {
          throw new Error('invalid multiplicative expression, expecting the right part.');
        }
      }
    }
    if (node === null) {
      throw new Error('multiplicative expression expected');
    }
    return node;
  }

  /**
   * 语法解析：基础表达式
   * @param tokens Token读取器
   * @returns AST节点
   * @throws 解析错误时抛出异常
   */
  private primary(tokens: TokenReader): SimpleASTNode {
    // pri -> Id | Num | (add)
    let node: SimpleASTNode | null = null;
    let token = tokens.peek();
    if (token !== null) {
      if (token.getType() === TokenType.IntLiteral) {
        token = tokens.read();
        node = new SimpleASTNode(ASTNodeType.IntLiteral, token!.getText());
      } else if (token.getType() === TokenType.Identifier) {
        token = tokens.read();
        node = new SimpleASTNode(ASTNodeType.Identifier, token!.getText());
      } else if (token.getType() === TokenType.LeftParen) {
        tokens.read();
        // 处理(add)
        node = this.additive(tokens);
        if (node !== null) {
          token = tokens.peek();
          if (token !== null && token.getType() === TokenType.RightParen) {
            tokens.read();
          } else {
            throw new Error('expecting right parenthesis');
          }
        } else {
          throw new Error('expecting an additive expression inside parenthesis');
        }
      }
    }
    if (node === null) {
      throw new Error('primary expression expected');
    }
    return node;
  }

  /**
   * 打印输出AST的树状结构
   * @param {ASTNode} node AST节点
   * @param {string} indent 缩进字符串
   */
  public dumpAST(node: ASTNode, indent: string): void {
    console.log(indent + node.getType() + ' ' + node.getText());
    for (const child of node.getChildren()) {
      this.dumpAST(child, indent + '\t');
    }
  }
}

/**
 * 测试方法
 */
const testSimpleCalculator = () => {
  const calculator = new SimpleCalculator();
  // 测试变量声明语句的解析
  let script = 'int a = b+3;';
  console.log('解析变量声明语句: ' + script);
  // 词法解析
  const lexer = new SimpleLexer();
  const tokens = lexer.tokenize(script);
  // 语法解析(已封装到prog)
  try {
    const node = calculator.intDeclare(tokens);
    calculator.dumpAST(node, '');
  } catch (e) {
    console.log(e instanceof Error ? e.message : String(e));
  }

  // 测试表达式
  script = '1 + 2 * 3';
  console.log('\n计算: ' + script);
  calculator.evaluate(script);

  // 测试语法错误
  script = '2+';
  console.log('\n: ' + script + ' 抛出语法错误');
  calculator.evaluate(script);

  script = '2+3+4';
  console.log('\n计算: ' + script + '修复结核性错误');
  calculator.evaluate(script);
};

// 运行测试
// testLexer();
testSimpleCalculator();
