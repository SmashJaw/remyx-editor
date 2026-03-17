import { test, expect } from '@playwright/test'

test.describe('Keyboard Shortcuts', () => {
  const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Ctrl/Cmd+B toggles bold', async ({ page }) => {
    const editArea = page.locator('[contenteditable="true"]').first()
    await editArea.click()
    await editArea.pressSequentially('Normal ')

    await editArea.press(`${modifier}+b`)
    await editArea.pressSequentially('bold')
    await editArea.press(`${modifier}+b`)

    const boldContent = page.locator('[contenteditable="true"] strong, [contenteditable="true"] b')
    await expect(boldContent.first()).toContainText('bold')
  })

  test('Ctrl/Cmd+I toggles italic', async ({ page }) => {
    const editArea = page.locator('[contenteditable="true"]').first()
    await editArea.click()
    await editArea.pressSequentially('Normal ')

    await editArea.press(`${modifier}+i`)
    await editArea.pressSequentially('italic')
    await editArea.press(`${modifier}+i`)

    const italicContent = page.locator('[contenteditable="true"] em, [contenteditable="true"] i')
    await expect(italicContent.first()).toContainText('italic')
  })

  test('Ctrl/Cmd+U toggles underline', async ({ page }) => {
    const editArea = page.locator('[contenteditable="true"]').first()
    await editArea.click()
    await editArea.pressSequentially('Normal ')

    await editArea.press(`${modifier}+u`)
    await editArea.pressSequentially('underlined')
    await editArea.press(`${modifier}+u`)

    const underlineContent = page.locator('[contenteditable="true"] u')
    await expect(underlineContent.first()).toContainText('underlined')
  })

  test('Ctrl/Cmd+Z undoes the last action', async ({ page }) => {
    const editArea = page.locator('[contenteditable="true"]').first()
    await editArea.click()

    // Clear existing content and type new text
    await editArea.press(`${modifier}+a`)
    await editArea.pressSequentially('First text')
    await editArea.pressSequentially(' extra')
    await editArea.press(`${modifier}+z`)

    // After undo, the 'extra' text should be removed
    const contentAfter = await editArea.textContent()
    expect(contentAfter).not.toContain('extra')
  })
})
