import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router'
import './App.css'

const navItems = [
  {
    label: 'Finanzas',
    path: '/finanzas',
    icon: '$',
  },
  {
    label: 'Gastos',
    path: '/gastos',
    icon: '#',
  },
]

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const expenseCategories = [
  'Bebidas',
  'Comida',
  'Suscripciones',
  'Entretenimiento',
  'Juegos',
  'Delivery',
]
const newProductValue = '__nuevo__'

function Finanzas() {
  const spendingLimit = 600
  const [incomeAmount, setIncomeAmount] = useState('')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseCategory, setExpenseCategory] = useState(expenseCategories[0])
  const [expenseProduct, setExpenseProduct] = useState('')
  const [newExpenseProduct, setNewExpenseProduct] = useState('')
  const [expenseIngredients, setExpenseIngredients] = useState('')
  const [products, setProducts] = useState([])
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

  const loadProducts = async () => {
    const response = await fetch(`${API_URL}/api/productos`)

    if (!response.ok) {
      throw new Error('No se pudieron cargar los productos.')
    }

    return response.json()
  }

  useEffect(() => {
    let ignore = false

    async function hydrateData() {
      try {
        const [summaryData, productData] = await Promise.all([loadSummary(), loadProducts()])

        if (!ignore) {
          applySummary(summaryData)
          setProducts(productData)
        }
      } catch {
        if (!ignore) {
          setStatusMessage('Inicia el backend para cargar los datos guardados.')
        }
      }
    }

    hydrateData()

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

  const saveMovement = async (tipo, monto, details = {}) => {
    setIsSaving(true)
    setStatusMessage('')

    try {
      const response = await fetch(`${API_URL}/api/finanzas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tipo, monto, ...details }),
      })

      if (!response.ok) {
        throw new Error('No se pudo guardar el movimiento.')
      }

      const data = await loadSummary()
      applySummary(data)
      setProducts(await loadProducts())
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
    const product =
      expenseProduct === newProductValue ? newExpenseProduct.trim() : expenseProduct.trim()

    if (!value || value <= 0) {
      return
    }

    if (!product) {
      setStatusMessage('Indica el producto comprado.')
      return
    }

    saveMovement('gasto', value, {
      categoria: expenseCategory,
      producto: product,
      ingredientes: expenseIngredients,
    })
    setExpenseAmount('')
    setExpenseProduct('')
    setNewExpenseProduct('')
    setExpenseIngredients('')
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
            <div className="expense-form-grid">
              <select
                aria-label="Categoria"
                value={expenseCategory}
                onChange={(event) => setExpenseCategory(event.target.value)}
              >
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                aria-label="Producto comprado"
                value={expenseProduct}
                onChange={(event) => setExpenseProduct(event.target.value)}
              >
                <option value="">Producto</option>
                {products.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
                <option value={newProductValue}>Nuevo producto</option>
              </select>
              {expenseProduct === newProductValue && (
                <input
                  aria-label="Nuevo producto"
                  value={newExpenseProduct}
                  onChange={(event) => setNewExpenseProduct(event.target.value)}
                  placeholder="Producto comprado"
                />
              )}
              <input
                id="expense-amount"
                min="0"
                step="0.01"
                type="number"
                value={expenseAmount}
                onChange={(event) => setExpenseAmount(event.target.value)}
                placeholder="0"
              />
              <textarea
                aria-label="Ingredientes"
                value={expenseIngredients}
                onChange={(event) => setExpenseIngredients(event.target.value)}
                placeholder={'Ingredientes\n- Agua\n- Azucar'}
                rows="5"
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

function Gastos() {
  const [expenses, setExpenses] = useState([])
  const [editingExpense, setEditingExpense] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [editCategory, setEditCategory] = useState(expenseCategories[0])
  const [editProduct, setEditProduct] = useState('')
  const [editIngredients, setEditIngredients] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const dateFormatter = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const loadExpenses = async () => {
    const response = await fetch(`${API_URL}/api/gastos`)

    if (!response.ok) {
      throw new Error('No se pudieron cargar los gastos.')
    }

    return response.json()
  }

  useEffect(() => {
    let ignore = false

    loadExpenses()
      .then((data) => {
        if (!ignore) {
          setExpenses(data)
        }
      })
      .catch((error) => {
        if (!ignore) {
          setStatusMessage(error.message)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  const startEditing = (expense) => {
    setEditingExpense(expense)
    setEditAmount(String(expense.monto))
    setEditCategory(expense.categoria || expenseCategories[0])
    setEditProduct(expense.producto || '')
    setEditIngredients(expense.ingredientes || '')
    setStatusMessage('')
  }

  const closeEditor = () => {
    setEditingExpense(null)
    setEditAmount('')
    setEditProduct('')
    setEditIngredients('')
  }

  const saveExpense = async (event) => {
    event.preventDefault()
    const amount = Number(editAmount)

    if (!editingExpense || !amount || amount <= 0) {
      return
    }

    if (!editProduct.trim()) {
      setStatusMessage('Indica el producto comprado.')
      return
    }

    setIsSaving(true)
    setStatusMessage('')

    try {
      const response = await fetch(`${API_URL}/api/gastos/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monto: amount,
          categoria: editCategory,
          producto: editProduct,
          ingredientes: editIngredients,
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo actualizar el gasto.')
      }

      setExpenses(await loadExpenses())
      setStatusMessage('Gasto actualizado.')
      closeEditor()
    } catch (error) {
      setStatusMessage(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="page-panel expenses-panel">
      <p className="eyebrow">Detalle</p>
      <h1>Gastos</h1>
      {statusMessage && <p className="form-status">{statusMessage}</p>}
      {editingExpense && (
        <form className="edit-expense-form" onSubmit={saveExpense}>
          <div className="edit-form-header">
            <h2>Editar gasto</h2>
            <button type="button" onClick={closeEditor}>
              Cancelar
            </button>
          </div>
          <div className="expense-form-grid">
            <select
              aria-label="Categoria"
              value={editCategory}
              onChange={(event) => setEditCategory(event.target.value)}
            >
              {expenseCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              aria-label="Producto comprado"
              value={editProduct}
              onChange={(event) => setEditProduct(event.target.value)}
              placeholder="Producto comprado"
            />
            <input
              aria-label="Cantidad"
              min="0"
              step="0.01"
              type="number"
              value={editAmount}
              onChange={(event) => setEditAmount(event.target.value)}
              placeholder="0"
            />
            <textarea
              aria-label="Ingredientes"
              value={editIngredients}
              onChange={(event) => setEditIngredients(event.target.value)}
              placeholder={'Ingredientes\n- Agua\n- Azucar'}
              rows="6"
            />
            <button type="submit" disabled={isSaving}>
              Guardar cambios
            </button>
          </div>
        </form>
      )}
      <div className="expenses-table-wrap">
        <table className="expenses-table">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Producto</th>
              <th>Fecha</th>
              <th>Cantidad</th>
              <th>Ingredientes</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td>{expense.categoria || '-'}</td>
                <td>{expense.producto || '-'}</td>
                <td>{dateFormatter.format(new Date(expense.creado_en))}</td>
                <td>{formatter.format(expense.monto)}</td>
                <td>
                  <span className="ingredients-cell">{expense.ingredientes || '-'}</span>
                </td>
                <td>
                  <button className="table-action-button" type="button" onClick={() => startEditing(expense)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {!expenses.length && (
              <tr>
                <td colSpan="6">Sin gastos registrados</td>
              </tr>
            )}
          </tbody>
        </table>
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
          <Route path="/gastos" element={<Gastos />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
