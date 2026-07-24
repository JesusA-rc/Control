import { useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router'
import './App.css'

const navItems = [
  {
    label: 'Finanzas',
    path: '/finanzas',
    icon: '$',
  },
]

function Finanzas() {
  const spendingLimit = 600
  const [incomeAmount, setIncomeAmount] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)

  const balance = income - expenses
  const limitProgress = Math.min((expenses / spendingLimit) * 100, 100)
  const limitStatus = useMemo(() => {
    if (expenses >= spendingLimit) {
      return 'danger'
    }

    if (expenses >= spendingLimit / 2) {
      return 'warning'
    }

    return 'normal'
  }, [expenses])

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  })

  const addIncome = (event) => {
    event.preventDefault()
    const value = Number(incomeAmount)

    if (!value || value <= 0) {
      return
    }

    setIncome((currentIncome) => currentIncome + value)
    setIncomeAmount('')
  }

  const addExpense = (event) => {
    event.preventDefault()
    const value = Number(expenseAmount)

    if (!value || value <= 0) {
      return
    }

    setExpenses((currentExpenses) => currentExpenses + value)
    setExpenseAmount('')
  }

  return (
    <section className="page-panel">
      <p className="eyebrow">Panel</p>
      <h1>Finanzas</h1>
      <div className="finance-grid">
        <article>
          <span>Balance</span>
          <strong>{formatter.format(balance)}</strong>
        </article>
        <article>
          <span>Ingresos</span>
          <strong>{formatter.format(income)}</strong>
        </article>
        <article>
          <span>Gastos</span>
          <strong>{formatter.format(expenses)}</strong>
        </article>
      </div>

      <div className="finance-actions">
        <article className={`limit-card ${limitStatus}`}>
          <div className="limit-header">
            <div>
              <span>Limite de gastos</span>
              <strong>{formatter.format(expenses)}</strong>
            </div>
            <p>{formatter.format(spendingLimit)}</p>
          </div>
          <div className="limit-track" aria-hidden="true">
            <div style={{ width: `${limitProgress}%` }}></div>
          </div>
          <p className="limit-copy">
            {limitStatus === 'danger'
              ? 'Limite alcanzado'
              : `${formatter.format(spendingLimit - expenses)} disponibles`}
          </p>
        </article>

        <div className="money-forms">
          <form onSubmit={addIncome}>
            <label htmlFor="income-amount">Guardar ingreso</label>
            <div className="money-control">
              <input
                id="income-amount"
                min="0"
                step="1"
                type="number"
                value={incomeAmount}
                onChange={(event) => setIncomeAmount(event.target.value)}
                placeholder="0"
              />
              <button type="submit">Guardar</button>
            </div>
          </form>

          <form onSubmit={addExpense}>
            <label htmlFor="expense-amount">Realizar gasto</label>
            <div className="money-control">
              <input
                id="expense-amount"
                min="0"
                step="1"
                type="number"
                value={expenseAmount}
                onChange={(event) => setExpenseAmount(event.target.value)}
                placeholder="0"
              />
              <button type="submit">Gastar</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegacion principal">
        <div className="brand-mark">C</div>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className="nav-link">
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <div className="content-topline">
          <span>Control</span>
          <span>2026</span>
        </div>
        <Routes>
          <Route path="/" element={<Navigate to="/finanzas" replace />} />
          <Route path="/finanzas" element={<Finanzas />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
