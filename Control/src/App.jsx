import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router'
import './App.css'

const navItems = [
  {
    label: 'Finanzas',
    path: '/finanzas',
    icon: '$',
  },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function Finanzas() {
  const spendingLimit = 600
  const [incomeAmount, setIncomeAmount] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [income, setIncome] = useState(0)
  const [expenses, setExpenses] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const applySummary = (data) => {
    setIncome(Number(data.ingresos) || 0)
    setExpenses(Number(data.gastos) || 0)
  }

  const loadSummary = async () => {
    const response = await fetch(`${API_URL}/api/finanzas/resumen`)

    if (!response.ok) {
      throw new Error('No se pudo cargar el resumen.')
    }

    return response.json()
  }

  useEffect(() => {
    let ignore = false

    async function hydrateSummary() {
      try {
        const data = await loadSummary()

        if (!ignore) {
          applySummary(data)
        }
      } catch {
        if (!ignore) {
          setStatusMessage('Inicia el backend para cargar los datos guardados.')
        }
      }
    }

    hydrateSummary()

    return () => {
      ignore = true
    }
  }, [])

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const saveMovement = async (tipo, monto) => {
    setIsSaving(true)
    setStatusMessage('')

    try {
      const response = await fetch(`${API_URL}/api/finanzas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tipo, monto }),
      })

      if (!response.ok) {
        throw new Error('No se pudo guardar el movimiento.')
      }

      const data = await loadSummary()
      applySummary(data)
      setStatusMessage('Movimiento guardado.')
    } catch (error) {
      setStatusMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const addIncome = (event) => {
    event.preventDefault()
    const value = Number(incomeAmount)

    if (!value || value <= 0) {
      return
    }

    saveMovement('ingreso', value)
    setIncomeAmount('')
  }

  const addExpense = (event) => {
    event.preventDefault()
    const value = Number(expenseAmount)

    if (!value || value <= 0) {
      return
    }

    saveMovement('gasto', value)
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
                step="0.01"
                type="number"
                value={incomeAmount}
                onChange={(event) => setIncomeAmount(event.target.value)}
                placeholder="0"
              />
              <button type="submit" disabled={isSaving}>
                Guardar
              </button>
            </div>
          </form>

          <form onSubmit={addExpense}>
            <label htmlFor="expense-amount">Realizar gasto</label>
            <div className="money-control">
              <input
                id="expense-amount"
                min="0"
                step="0.01"
                type="number"
                value={expenseAmount}
                onChange={(event) => setExpenseAmount(event.target.value)}
                placeholder="0"
              />
              <button type="submit" disabled={isSaving}>
                Gastar
              </button>
            </div>
          </form>
          {statusMessage && <p className="form-status">{statusMessage}</p>}
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
