# Demo01_SimpleLexer

- 基于正则文法和有限自动机
- 实现简单的词法分析器
- 能识别 Identifier、IntLiteral、保留关键字int和简单操作符
- 核心是依据构造好的有限自动机，在不同的状态中迁移解析出 token
- 关注 SimpleLexer.tokenize 和 SimpleLexer.initToken

# Demo02_Calculator

- 基于递归下降算法和上下文无关文法, 实现简单的语法分析器, 生成简化的AST
- 能处理简单的公式计算
- 存在结合性问题，仅优化了加法表达式

# Demo03_SimpleParser

- 在Demo02基础上实现一个简单的语法解析器
- 能够解析简单的表达式、变量声明和初始化语句、赋值语句
- 核心在于解决二元表达式中的难点: 确保正确的优先级和结合性，以及消除左递归
