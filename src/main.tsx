/*
 * @Author: csxiaoyaojianxian 1724338257@qq.com
 * @Date: 2025-04-05 00:26:36
 * @LastEditors: csxiaoyaojianxian 1724338257@qq.com
 * @LastEditTime: 2025-04-05 12:17:27
 * @FilePath: /CompilerDemo/src/main.tsx
 * @Description: 入口函数
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './assets/index.css';
import './Demo03_SimpleParser';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ul>
      <li>
        <h1>Demo01_SimpleLexer</h1>
        <p>
          基于正则文法和有限自动机, 实现简单的词法分析器, 能识别
          Identifier、IntLiteral、保留关键字int和简单操作符。
          核心是依据构造好的有限自动机，在不同的状态中迁移解析出 token。关注 SimpleLexer.tokenize 和
          SimpleLexer.initToken
        </p>
      </li>
      <li>
        <h1>Demo02_Calculator</h1>
        <p>
          基于递归下降算法和上下文无关文法, 实现简单的语法分析器, 生成简化的AST。
          能处理简单的公式计算。 存在结合性问题，仅优化了加法表达式。
        </p>
      </li>
      <li>
        <h1>Demo03_SimpleParser</h1>
        <p>
          在Demo02基础上实现一个简单的语法解析器。
          能够解析简单的表达式、变量声明和初始化语句、赋值语句。 核心在于解决二元表达式中的难点:
          确保正确的优先级和结核性，以及消除左递归。
        </p>
      </li>
    </ul>
  </StrictMode>
);
