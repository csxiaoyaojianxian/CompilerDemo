/**
 * 一个简单的语法解析器
 * 基于递归下降算法和上下文无关文法, 生成简化的AST
 * 能够解析简单的表达式、变量声明和初始化语句、赋值语句
 * 核心在于解决二元表达式中的难点: 确保正确的优先级和结合性，以及消除左递归
 * 关注赋值表达式，使用了"回溯"
 *
 * 支持的语法规则:
 * programm -> intDeclare | expressionStatement | assignmentStatement
 * intDeclare -> 'int' Id ( = additive) ';'
 * expressionStatement -> addtive ';'
 * addtive -> multiplicative ( (+ | -) multiplicative)*
 * multiplicative -> primary ( (* | /) primary)*
 * primary -> IntLiteral | Id | (additive)
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

class SimpleParser {
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
   * 语法解析：根节点
   * @param {TokenReader} tokens Token读取器
   * @returns {SimpleASTNode} AST节点
   * @throws 解析错误时抛出异常
   */
  private prog(tokens: TokenReader): SimpleASTNode {
    const node = new SimpleASTNode(ASTNodeType.Programm, 'demo');

    while (tokens.peek()) {
      let child: SimpleASTNode | null = this.intDeclare(tokens);
      if (child === null) {
        child = this.expressionStatement(tokens);
      }
      if (child === null) {
        child = this.assignmentStatement(tokens);
      }
      if (child) {
        node.addChild(child);
      } else {
        throw new Error('unknown statement');
      }
    }

    return node;
  }

  /**
   * 表达式语句，即表达式后面跟个分号。
   * @return
   * @throws Exception
   */
  public expressionStatement(tokens: TokenReader): SimpleASTNode | null {
    const pos = tokens.getPosition();
    let node: SimpleASTNode | null = this.additive(tokens);
    if (node) {
      const token = tokens.peek();
      if (token && token.getType() === TokenType.SemiColon) {
        tokens.read();
      } else {
        node = null;
        tokens.setPosition(pos); // 回溯
      }
    }
    return node; //直接返回子节点，简化了AST。
  }

  /**
   * 赋值语句
   * @param {TokenReader} tokens Token读取器
   * @return { SimpleASTNode | null } AST节点
   * @throws 解析错误时抛出异常
   */
  public assignmentStatement(tokens: TokenReader): SimpleASTNode | null {
    let node: SimpleASTNode | null = null;
    let token: Token | null = tokens.peek(); // 预读当前token
    if (token && token.getType() === TokenType.Identifier) {
      token = tokens.read(); // 读入标识符
      node = new SimpleASTNode(ASTNodeType.AssignmentStmt, token!.getText());
      token = tokens.peek(); // 预读判断等号
      if (token && token.getType() == TokenType.Assignment) {
        tokens.read(); // 取出等号
        const child = this.additive(tokens);
        if (child == null) {
          // 出错，等号右面没有一个合法的表达式
          throw new Error('invalide assignment statement, expecting an expression');
        } else {
          node.addChild(child); // 添加子节点
          token = tokens.peek(); // 预读判断分号
          if (token && token.getType() == TokenType.SemiColon) {
            tokens.read(); // 消耗掉分号
          } else {
            // 出错，缺少分号
            throw new Error('invalid statement, expecting semicolon');
          }
        }
      } else {
        tokens.unread(); // 回溯，吐出之前消化掉的标识符
        node = null;
      }
    }
    return node;
  }

  /**
   * 整型变量声明语句
   * @param {TokenReader} tokens Token读取器
   * @returns {SimpleASTNode} AST节点
   * @throws 解析错误时抛出异常
   */
  public intDeclare(tokens: TokenReader): SimpleASTNode | null {
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
        if (token && token.getType() === TokenType.Assignment) {
          tokens.read(); // 消耗掉等号
          // [4] 匹配表达式
          const child = this.additive(tokens);
          if (child === null) {
            throw new Error('invalide variable initialization, expecting an expression');
          } else {
            node.addChild(child);
          }
        }
      } else {
        throw new Error('variable name expected');
      }
      if (node) {
        token = tokens.peek();
        if (token && token.getType() === TokenType.SemiColon) {
          tokens.read();
        } else {
          throw new Error('invalid statement, expecting semicolon');
        }
      }
    }
    return node;
  }

  /**
   * 语法解析：加法表达式
   * 包含减法，因为减法是特殊的加法
   * @param {TokenReader} tokens Token读取器
   * @returns {SimpleASTNode} AST节点
   * @throws 解析错误时抛出异常
add -> mul + add 出现结合性bug，如 2+3+4 的顺序为 2+(3+4)

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
    // add -> mul (+ mul)*
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
          if (child2) {
            node = new SimpleASTNode(ASTNodeType.Additive, token!.getText());
            node.addChild(child1); //注意，新节点在顶层，保证正确的结合性
            node.addChild(child2);
            child1 = node; // 核心，实现左结合
          } else {
            throw new Error('invalid additive expression, expecting the right part.');
          }
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
    // mul -> pri (* pri)*
    let child1: SimpleASTNode = this.primary(tokens);
    let node: SimpleASTNode = child1;
    while (true) {
      let token = tokens.peek();
      if (token && (token.getType() == TokenType.Star || token.getType() == TokenType.Slash)) {
        token = tokens.read();
        const child2 = this.multiplicative(tokens);
        if (child2) {
          node = new SimpleASTNode(ASTNodeType.Multiplicative, token!.getText());
          node.addChild(child1);
          node.addChild(child2);
          child1 = node;
        } else {
          throw new Error('invalid multiplicative expression, expecting the right part.');
        }
      } else {
        break;
      }
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
  const parser = new SimpleParser();
  let script: string;
  let tree: ASTNode;

  try {
    script = 'int age = 1+2+3;';
    console.log('解析：' + script);
    tree = parser.parse(script);
    parser.dumpAST(tree, '');
  } catch (e) {
    console.log(e);
  }
};

// 运行测试
// testLexer();
// testSimpleCalculator();

export default SimpleParser;
export { ASTNodeType };
export type { ASTNode };
