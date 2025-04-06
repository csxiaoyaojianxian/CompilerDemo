import SimpleParser, { ASTNodeType, ASTNode } from '../Demo03_SimpleParser';

/**
 * 一个简单的脚本解释器
 * 支持变量，包括变量的声明语句、表达式语句、赋值语句
 */
class SimpleScript {
  // 临时用一种简单的方式存放变量
  private variables: Map<string, number | null> = new Map();

  /**
   * 遍历 AST 计算值
   * @param {ASTNode} node AST节点
   * @param {string} indent 缩进字符串
   * @returns {number|null} 计算结果
   */
  public evaluate(node: ASTNode, indent: string): number | null {
    let result: number | null = null;

    switch (node.getType()) {
      case ASTNodeType.Programm:
        for (const child of node.getChildren()) {
          result = this.evaluate(child, indent);
        }
        break;
      case ASTNodeType.Additive: {
        const child1 = node.getChildren()[0];
        const value1 = this.evaluate(child1, indent + '\t');
        const child2 = node.getChildren()[1];
        const value2 = this.evaluate(child2, indent + '\t');
        if (node.getText() === '+') {
          result = value1! + value2!;
        } else {
          result = value1! - value2!;
        }
        break;
      }
      case ASTNodeType.Multiplicative: {
        const child3 = node.getChildren()[0];
        const value3 = this.evaluate(child3, indent + '\t');
        const child4 = node.getChildren()[1];
        const value4 = this.evaluate(child4, indent + '\t');
        if (node.getText() === '*') {
          result = value3! * value4!;
        } else {
          result = Math.floor(value3! / value4!); // 整数除法
        }
        break;
      }
      case ASTNodeType.IntLiteral:
        result = parseInt(node.getText(), 10);
        break;
      case ASTNodeType.Identifier: {
        const varName = node.getText();
        // 变量处理
        if (this.variables.has(varName)) {
          const value = this.variables.get(varName) || null;
          if (value !== null) {
            result = value;
          } else {
            throw new Error(`variable ${varName} has not been set any value`);
          }
        } else {
          throw new Error(`unknown variable: ${varName}`);
        }
        break;
      }
      case ASTNodeType.AssignmentStmt: {
        const assignVarName = node.getText();
        // 获取变量
        if (!this.variables.has(assignVarName)) {
          throw new Error(`unknown variable: ${assignVarName}`);
        }
      }
      // 接着执行下面的代码
      // eslint-disable-next-line no-fallthrough
      case ASTNodeType.IntDeclaration: {
        const declVarName = node.getText();
        if (node.getChildren().length > 0) {
          const child = node.getChildren()[0];
          result = this.evaluate(child, indent + '\t');
          this.variables.set(declVarName, result);
        } else {
          this.variables.set(declVarName, null);
        }
        break;
      }
      default:
      // 其他类型不处理
    }

    if (indent === '') {
      // 顶层的语句
      if (
        node.getType() === ASTNodeType.IntDeclaration ||
        node.getType() === ASTNodeType.AssignmentStmt
      ) {
        console.log(`${node.getText()}: ${result}`);
      } else if (node.getType() !== ASTNodeType.Programm) {
        console.log(result);
      }
    }
    return result;
  }
}

/**
 * 测试方法
 */
const testSimpleCalculator = () => {
  const parser = new SimpleParser();
  const script = new SimpleScript();

  let scriptText = 'int age = 1+2; age+3;'; // 6
  let tree = parser.parse(scriptText);
  parser.dumpAST(tree, '');
  script.evaluate(tree, '');

  scriptText = 'int a = 1+2;';
  tree = parser.parse(scriptText);
  parser.dumpAST(tree, '');
  script.evaluate(tree, '');
};
testSimpleCalculator();
